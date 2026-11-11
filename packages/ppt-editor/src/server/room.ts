import * as Y from 'yjs'
import { OfficeDocument } from '../core/index.js'
import {
  decodeBytes,
  encodeBytes,
  textKey,
  type Principal,
  type RoomOperation,
  type RoomSnapshot,
} from '../collaboration/protocol.js'
import { loadText, replaceText, textState } from '../collaboration/text.js'
import type { Command } from '../types.js'

export interface PersistedRoom {
  version: 1
  document: string
  texts: Record<string, string>
  revision: number
  epoch: number
  fence: number
  candidate?: string
  candidateTexts?: Record<string, string>
  generation?: RoomSnapshot['generation']
  events: Record<string, string>
  completed?: Record<
    string,
    { owner: string; fence: number; events: Record<string, string> }
  >
  seen: Record<
    string,
    { principal: string; operation: string; result: unknown }
  >
}
export interface RoomStore {
  load(roomId: string): Promise<PersistedRoom | undefined>
  save(roomId: string, room: PersistedRoom): Promise<void>
}
const entities = (doc: OfficeDocument) => {
  const s = doc.getScene()
  return [...s.slides, ...s.masters, ...s.layouts].flatMap((p) =>
    p.objects.filter((o) => !o.inherited)
  )
}
export class PresentationRoom {
  private doc = OfficeDocument.create()
  private candidate?: OfficeDocument
  private texts: Record<string, string> = {}
  private candidateTexts?: Record<string, string>
  private revision = 0
  private epoch = 0
  private fence = 0
  private generation?: RoomSnapshot['generation']
  private events: Record<string, string> = {}
  private completed: NonNullable<PersistedRoom['completed']> = {}
  private seen: PersistedRoom['seen'] = {}
  private tail: Promise<unknown> = Promise.resolve()
  private committed = this.checkpoint()
  constructor(
    readonly id: string,
    private store?: RoomStore
  ) {}
  async restore() {
    const data = await this.store?.load(this.id)
    if (data) {
      this.adopt(data)
      this.committed = data
    }
  }
  private adopt(data: PersistedRoom) {
    if (data.version !== 1) throw new Error('Unsupported room checkpoint')
    this.doc = OfficeDocument.load(decodeBytes(data.document))
    this.texts = { ...data.texts }
    this.revision = data.revision
    this.epoch = data.epoch
    this.fence = data.fence
    this.candidate = data.candidate
      ? OfficeDocument.load(decodeBytes(data.candidate))
      : undefined
    this.candidateTexts = data.candidateTexts
      ? { ...data.candidateTexts }
      : undefined
    this.generation = data.generation ? { ...data.generation } : undefined
    this.events = { ...data.events }
    this.seen = { ...data.seen }
    this.completed = structuredClone(data.completed ?? {})
  }
  private checkpoint(): PersistedRoom {
    return {
      version: 1,
      document: encodeBytes(this.doc.export()),
      texts: { ...this.texts },
      revision: this.revision,
      epoch: this.epoch,
      fence: this.fence,
      candidate: this.candidate
        ? encodeBytes(this.candidate.export())
        : undefined,
      candidateTexts: this.candidateTexts
        ? { ...this.candidateTexts }
        : undefined,
      generation: this.generation ? { ...this.generation } : undefined,
      events: { ...this.events },
      seen: { ...this.seen },
      completed: structuredClone(this.completed),
    }
  }
  snapshot(): RoomSnapshot {
    const {
      document,
      candidate,
      texts,
      candidateTexts,
      revision,
      epoch,
      generation,
    } = this.committed
    return {
      pptx: candidate ?? document,
      texts: { ...(candidateTexts ?? texts) },
      revision,
      epoch,
      generation: generation ? { ...generation } : undefined,
    }
  }
  apply(
    principal: Principal,
    opId: string,
    operation: RoomOperation
  ): Promise<unknown> {
    const task = this.tail.then(async () => {
      if (principal.role !== 'editor')
        throw new Error('FORBIDDEN: read-only member')
      if (typeof opId !== 'string' || !opId || opId.length > 128)
        throw new Error('Invalid operation ID')
      const encoded = JSON.stringify(operation, (_k, v) =>
        v instanceof Uint8Array ? { $bytes: encodeBytes(v) } : v
      )
      const seen = this.seen[opId]
      if (seen) {
        if (seen.principal !== principal.id || seen.operation !== encoded)
          throw new Error('Operation ID reused with different payload')
        return seen.result
      }
      const previous = this.committed
      try {
        const result = this.mutate(principal, operation)
        this.seen[opId] = {
          principal: principal.id,
          operation: encoded,
          result,
        }
        const keys = Object.keys(this.seen)
        if (keys.length > 1000) delete this.seen[keys[0]!]
        const checkpoint = this.checkpoint()
        await this.store?.save(this.id, checkpoint)
        this.committed = checkpoint
        return result
      } catch (error) {
        this.adopt(previous)
        throw error
      }
    })
    this.tail = task.catch(() => {})
    return task
  }
  private syncTexts(doc: OfficeDocument, states: Record<string, string>) {
    const live = new Set<string>()
    for (const object of entities(doc)) {
      if (object.text === undefined) continue
      const key = textKey(object)
      live.add(key)
      const y = loadText(states[key])
      replaceText(y, object.text)
      states[key] = textState(y)
      y.destroy()
    }
    for (const key of Object.keys(states))
      if (!live.has(key)) delete states[key]
  }
  private command(
    doc: OfficeDocument,
    states: Record<string, string>,
    command: Command
  ) {
    const result = doc.execute(command)
    this.syncTexts(doc, states)
    return result
  }
  private mutate(principal: Principal, operation: RoomOperation): unknown {
    if (operation.kind === 'initialize') {
      if (
        this.revision !== 0 ||
        this.generation ||
        Object.keys(this.seen).length
      )
        throw new Error(
          'ROOM_ALREADY_INITIALIZED: source cannot overwrite an existing room'
        )
      this.doc = OfficeDocument.load(decodeBytes(operation.pptx))
      this.texts = {}
      this.syncTexts(this.doc, this.texts)
      this.revision++
      return { changed: true }
    }
    if (operation.kind === 'cancel') {
      this.assertLease(principal, operation.fence)
      this.generation!.error = 'Generation cancelled; draft retained'
      return { changed: true }
    }
    if (operation.kind === 'generation') {
      const event = operation.event
      if (
        !Number.isSafeInteger(event.seq) ||
        event.seq < 0 ||
        typeof event.sessionId !== 'string' ||
        !event.sessionId
      )
        throw new Error('Invalid generation event')
      const completed = this.completed[event.sessionId]
      if (completed) {
        if (
          completed.owner !== principal.id ||
          (event.type !== 'generation.start' &&
            completed.fence !== operation.fence) ||
          completed.events[event.seq] !== JSON.stringify(event)
        )
          throw new Error('Completed generation payload differs')
        return { changed: false }
      }
      if (event.type === 'generation.start') {
        if (this.generation) throw new Error('GENERATION_LOCKED')
        if (event.seq !== 0) throw new Error('Sequence must start at zero')
        this.candidate =
          event.mode === 'append'
            ? this.doc.clone()
            : OfficeDocument.create(event.title)
        this.candidateTexts = event.mode === 'append' ? { ...this.texts } : {}
        this.syncTexts(this.candidate, this.candidateTexts)
        this.generation = {
          sessionId: event.sessionId,
          seq: 0,
          owner: principal.id,
          fence: ++this.fence,
        }
        this.events = { '0': JSON.stringify(event) }
        return { fence: this.fence }
      }
      this.assertLease(principal, operation.fence)
      if (this.generation!.error)
        throw new Error(
          'Generation interrupted or cancelled; resolve the draft first'
        )
      if (event.sessionId !== this.generation!.sessionId)
        throw new Error('Unknown generation session')
      if (event.seq <= this.generation!.seq) {
        if (this.events[event.seq] !== JSON.stringify(event))
          throw new Error('Sequence payload differs')
        return { changed: false }
      }
      if (event.seq !== this.generation!.seq + 1)
        throw new Error('Sequence gap')
      if (event.type === 'command')
        this.command(this.candidate!, this.candidateTexts!, event.command)
      else if (event.type === 'generation.complete') {
        this.events[event.seq] = JSON.stringify(event)
        this.completed[event.sessionId] = {
          owner: principal.id,
          fence: this.generation!.fence,
          events: { ...this.events },
        }
        if (Object.keys(this.completed).length > 10)
          delete this.completed[Object.keys(this.completed)[0]!]
        this.promote()
        return { changed: true }
      } else if (event.type === 'generation.error')
        this.generation!.error = event.message
      else throw new Error('Unknown generation event')
      this.events[event.seq] = JSON.stringify(event)
      this.generation!.seq = event.seq
      return { changed: true }
    }
    if (operation.kind === 'draft') {
      this.assertLease(principal, operation.fence)
      if (operation.action === 'accept') this.promote()
      else if (operation.action === 'discard') {
        this.candidate = undefined
        this.candidateTexts = undefined
        this.generation = undefined
        this.epoch++
        this.events = {}
      } else throw new Error('Unknown draft action')
      return { changed: true }
    }
    if (this.generation)
      throw new Error('GENERATION_LOCKED: human editing is disabled')
    if (operation.kind === 'command') {
      if (operation.baseRevision !== this.revision)
        throw new Error(
          'REVISION_CONFLICT: retry after reviewing the latest document'
        )
      const result = this.command(this.doc, this.texts, operation.command)
      this.revision++
      return result
    }
    if (operation.kind === 'text') {
      if (operation.epoch !== this.epoch)
        throw new Error('STALE_EPOCH: keep the local text draft')
      const object = entities(this.doc).find(
        (o) => o.part === operation.ref.part && o.id === operation.ref.id
      )
      if (!object || object.text === undefined)
        throw new Error('TEXT_DELETED: keep the local text draft')
      const key = textKey(operation.ref),
        y = loadText(this.texts[key], object.text)
      try {
        Y.applyUpdate(y, decodeBytes(operation.update))
        if ([...y.share.keys()].some((k) => k !== 'content'))
          throw new Error('Invalid text schema')
        const value = y.getText('content').toString()
        if (value.length > 1_000_000) throw new Error('Text limit exceeded')
        this.doc.execute({ type: 'text.set', ref: operation.ref, text: value })
        this.texts[key] = textState(y)
      } finally {
        y.destroy()
      }
      this.revision++
      return { changed: true }
    }
    throw new Error('Unknown room operation')
  }
  private assertLease(principal: Principal, fence: number | undefined) {
    if (
      !this.generation ||
      this.generation.owner !== principal.id ||
      fence !== this.generation.fence
    )
      throw new Error('STALE_LEASE: generation owner or fence does not match')
  }
  private promote() {
    if (!this.candidate) throw new Error('No candidate')
    OfficeDocument.load(this.candidate.export())
    this.doc = this.candidate
    this.texts = this.candidateTexts!
    this.candidate = undefined
    this.candidateTexts = undefined
    this.generation = undefined
    this.events = {}
    this.epoch++
    this.revision++
  }
}
