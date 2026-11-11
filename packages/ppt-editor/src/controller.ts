import {
  CollaborationClient,
  decodeBytes,
  encodeBytes,
  textKey,
  textChange,
  type RoomSnapshot,
} from './collaboration/index.js'
import type { ObjectRef } from './types.js'
import { OfficeDocument } from './core/index.js'
import { parseGenerationEvent, readBinary } from './stream/index.js'
import type {
  Command,
  CommandResult,
  EditorState,
  GenerationEvent,
  PptEditorHandle,
  PptEditorOptions,
  PptSource,
} from './types.js'

export class EditorController implements PptEditorHandle {
  private collaboration?: CollaborationClient
  private remote?: RoomSnapshot
  private pendingGenerationStart?: Promise<{ fence?: number }>
  private connection: EditorState['connection'] = 'offline'
  private document = OfficeDocument.create()
  private candidate?: OfficeDocument
  private phase: EditorState['phase'] = 'ready'
  private error?: string
  private revision = 0
  private workspace: EditorState['workspace'] = 'slides'
  private listeners = new Set<(state: EditorState) => void>()
  private history: OfficeDocument[] = []
  private future: OfficeDocument[] = []
  private completedEvents = new Map<string, Map<number, string>>()
  private generation?: {
    sessionId: string
    seq: number
    events: Map<number, string>
  }
  private sourceVersion = 0
  private abort?: AbortController
  private options: PptEditorOptions

  constructor(options: PptEditorOptions = {}) {
    this.options = options
    if (options.title) this.document = OfficeDocument.create(options.title)
    if (options.collaboration) {
      this.collaboration = new CollaborationClient(options.collaboration)
      this.collaboration.onConnection((status) => {
        this.connection = status
        this.publish()
      })
      this.collaboration.onSnapshot((snapshot) => {
        this.remote = snapshot
        this.document = OfficeDocument.load(decodeBytes(snapshot.pptx))
        this.revision = snapshot.revision
        this.phase = snapshot.generation?.error
          ? 'error'
          : snapshot.generation
            ? 'generating'
            : 'ready'
        this.error = snapshot.generation?.error
        this.history = []
        this.future = []
        this.publish()
      })
      this.collaboration.connect()
    }
  }
  private sceneCache?: {
    document: OfficeDocument
    revision: number
    seq?: number
    scene: EditorState['scene']
  }
  private scene() {
    const document = this.candidate ?? this.document
    const seq = this.generation?.seq
    if (
      !this.sceneCache ||
      this.sceneCache.document !== document ||
      this.sceneCache.revision !== this.revision ||
      this.sceneCache.seq !== seq
    ) {
      this.sceneCache = {
        document,
        revision: this.revision,
        seq,
        scene: document.getScene(),
      }
    }
    // Public state has historically been mutable and detached from the document.
    return structuredClone(this.sceneCache.scene)
  }
  getState(): EditorState {
    return {
      phase: this.phase,
      editable:
        this.options.editable !== false &&
        this.phase === 'ready' &&
        !this.candidate &&
        (!this.collaboration ||
          (this.connection === 'connected' &&
            this.collaboration.principal?.role === 'editor')),
      revision: this.revision,
      scene: this.scene(),
      error: this.error,
      canUndo: this.history.length > 0,
      canRedo: this.future.length > 0,
      workspace: this.workspace,
      connection: this.collaboration ? this.connection : undefined,
      peers: this.remote?.peers,
      generation:
        this.remote?.generation ??
        (this.generation
          ? { sessionId: this.generation.sessionId, seq: this.generation.seq }
          : undefined),
    }
  }
  subscribe(listener: (state: EditorState) => void) {
    this.listeners.add(listener)
    listener(this.getState())
    return () => {
      this.listeners.delete(listener)
    }
  }
  private publish() {
    const state = this.getState()
    this.listeners.forEach((listener) => listener(state))
  }
  private alive() {
    if (this.phase === 'destroyed') throw new Error('Editor has been destroyed')
  }
  private writable() {
    this.alive()
    if (!this.getState().editable)
      throw new Error('Editor is read-only while loading or generating')
  }
  setEditable(editable: boolean) {
    this.options.editable = editable
    this.publish()
  }
  setWorkspace(workspace: EditorState['workspace']) {
    this.alive()
    this.workspace = workspace
    this.publish()
  }

  async open(source: PptSource): Promise<void> {
    this.alive()
    if (this.candidate || this.remote?.generation)
      throw new Error(
        'Resolve the active generation draft before opening another source'
      )
    this.abort?.abort()
    const abort = new AbortController()
    this.abort = abort
    const version = ++this.sourceVersion
    this.phase = 'loading'
    this.error = undefined
    this.candidate = undefined
    this.generation = undefined
    this.publish()
    try {
      const input =
        typeof source === 'string'
          ? { type: 'url' as const, url: source }
          : source instanceof ArrayBuffer || source instanceof Blob
            ? { type: 'file' as const, file: source }
            : source
      if (input.type === 'events') {
        this.phase = 'ready'
        for await (const event of input.events) {
          if (version !== this.sourceVersion) return
          await this.applyGenerationEvent(
            event.type === 'generation.start'
              ? { ...event, mode: input.mode ?? event.mode }
              : event
          )
        }
        if (this.generation || this.remote?.generation)
          throw new Error(
            'Stream ended without generation.complete; the draft has been retained'
          )
        return
      }
      let doc: OfficeDocument
      if (input.type === 'new') doc = OfficeDocument.create(input.title)
      else {
        let bytes: Uint8Array
        if (input.type === 'url') {
          const url = new URL(
            input.url,
            typeof location !== 'undefined' ? location.href : undefined
          )
          if (!['https:', 'http:', 'blob:'].includes(url.protocol))
            throw new Error('Unsupported document URL protocol')
          const response = await fetch(url, {
            ...input.request,
            signal: abort.signal,
          })
          if (!response.ok || !response.body)
            throw new Error(`Download failed: ${response.status}`)
          bytes = await readBinary(response.body, undefined, abort.signal)
        } else if (input.type === 'binary-stream')
          bytes = await readBinary(input.stream, undefined, abort.signal)
        else {
          const file = input.file
          if (
            (file instanceof ArrayBuffer ? file.byteLength : file.size) >
            100 * 1024 * 1024
          )
            throw new Error('File size limit exceeded')
          bytes = new Uint8Array(
            file instanceof ArrayBuffer ? file : await file.arrayBuffer()
          )
        }
        if (bytes[0] === 0xd0 && bytes[1] === 0xcf) {
          if (!this.options.conversion)
            throw new Error(
              'CONVERSION_REQUIRED: 旧版 PPT 需要配置 LibreOffice 转换服务'
            )
          bytes = await this.options.conversion.convert(
            bytes,
            'ppt',
            'pptx',
            abort.signal
          )
        }
        doc = OfficeDocument.load(bytes)
      }
      if (version !== this.sourceVersion) return
      if (this.collaboration) {
        await this.waitForConnection()
        if (version !== this.sourceVersion) return
        await this.collaboration.request({
          kind: 'initialize',
          pptx: encodeBytes(doc.export()),
        })
        return
      }
      this.document = doc
      this.history = []
      this.future = []
      this.revision++
      this.phase = 'ready'
      this.publish()
    } catch (error) {
      if (version !== this.sourceVersion) return
      this.phase = 'error'
      this.error = error instanceof Error ? error.message : String(error)
      this.publish()
      throw error
    }
  }

  async execute(command: Command): Promise<CommandResult> {
    this.writable()
    if (this.collaboration) {
      if (command.type === 'text.set' && !command.style) {
        const key = textKey(command.ref),
          base = this.remote?.texts[key]
        if (base)
          return this.collaboration.request({
            kind: 'text',
            ref: command.ref,
            epoch: this.remote!.epoch,
            update: textChange(base, command.text),
          })
      }
      return this.collaboration.request({
        kind: 'command',
        command,
        baseRevision: this.remote!.revision,
      })
    }
    const previous = this.document.clone()
    const result = this.document.execute(command)
    if (result.changed) {
      this.history.push(previous)
      if (this.history.length > 50) this.history.shift()
      this.future = []
      this.revision++
      this.publish()
    }
    return result
  }
  async undo() {
    this.writable()
    if (this.collaboration)
      throw new Error('协作模式暂不支持结构撤销，请使用反向编辑命令')
    const previous = this.history.pop()
    if (previous) {
      this.future.push(this.document)
      this.document = previous
      this.revision++
      this.publish()
    }
  }
  async redo() {
    this.writable()
    if (this.collaboration) throw new Error('协作模式暂不支持结构重做')
    const next = this.future.pop()
    if (next) {
      this.history.push(this.document)
      this.document = next
      this.revision++
      this.publish()
    }
  }

  async applyGenerationEvent(value: GenerationEvent): Promise<void> {
    this.alive()
    const event = parseGenerationEvent(value)
    if (this.collaboration) {
      const request = this.waitForConnection().then(() =>
        this.collaboration!.request({
          kind: 'generation',
          event,
          fence: this.remote?.generation?.fence,
        })
      )
      if (event.type === 'generation.start')
        this.pendingGenerationStart = request
      try {
        await request
      } finally {
        if (this.pendingGenerationStart === request)
          this.pendingGenerationStart = undefined
      }
      return
    }
    const completed = this.completedEvents.get(event.sessionId)
    if (completed) {
      if (completed.get(event.seq) === JSON.stringify(event)) return
      throw new Error('Completed generation payload differs')
    }
    if (
      this.generation &&
      event.sessionId === this.generation.sessionId &&
      event.seq <= this.generation.seq
    ) {
      if (this.generation.events.get(event.seq) !== JSON.stringify(event))
        throw new Error('Sequence replay payload differs')
      return
    }
    if (event.type === 'generation.start') {
      if (this.candidate)
        throw new Error('An active generation draft already exists')
      if (event.seq !== 0)
        throw new Error('Generation sequence must start at zero')
      this.candidate =
        event.mode === 'append'
          ? this.document.clone()
          : OfficeDocument.create(event.title)
      this.generation = {
        sessionId: event.sessionId,
        seq: 0,
        events: new Map([[0, JSON.stringify(event)]]),
      }
      this.phase = 'generating'
      this.error = undefined
      this.publish()
      return
    }
    const session = this.generation
    if (!session || !this.candidate || event.sessionId !== session.sessionId)
      throw new Error('Unknown generation session')
    if (this.phase === 'error')
      throw new Error(
        'Generation interrupted or cancelled; resolve the draft first'
      )
    if (event.seq !== session.seq + 1)
      throw new Error(`Sequence gap: expected ${session.seq + 1}`)
    if (event.type === 'command') this.candidate.execute(event.command)
    else if (event.type === 'generation.error') {
      this.phase = 'error'
      this.error = event.message
    } else if (event.type === 'generation.complete') {
      this.phase = 'finalizing'
      this.publish()
      OfficeDocument.load(this.candidate.export())
      session.events.set(event.seq, JSON.stringify(event))
      this.completedEvents.set(event.sessionId, new Map(session.events))
      if (this.completedEvents.size > 10)
        this.completedEvents.delete(this.completedEvents.keys().next().value!)
      this.promote()
      return
    }
    session.seq = event.seq
    session.events.set(event.seq, JSON.stringify(event))
    this.publish()
  }
  private promote() {
    if (!this.candidate) return
    this.history.push(this.document)
    this.document = this.candidate
    this.candidate = undefined
    this.generation = undefined
    this.future = []
    this.phase = 'ready'
    this.error = undefined
    this.revision++
    this.publish()
  }
  cancelGeneration() {
    this.alive()
    if (this.collaboration) {
      this.abort?.abort()
      this.sourceVersion++
      const collaboration = this.collaboration
      const fence = this.remote?.generation?.fence
      const start = this.pendingGenerationStart
      void (async () => {
        const lease = start ? (await start).fence : fence
        if (lease !== undefined)
          await collaboration.request({ kind: 'cancel', fence: lease })
      })().catch((error) => {
        this.error = String(error)
        this.publish()
      })
      return
    }
    if (this.candidate) {
      this.abort?.abort()
      this.sourceVersion++
      this.phase = 'error'
      this.error = '生成已中断，草稿已保留'
      this.publish()
    }
  }
  resolveDraft(action: 'accept' | 'discard') {
    this.alive()
    this.abort?.abort()
    this.sourceVersion++
    if (this.collaboration) {
      void this.collaboration
        .request({
          kind: 'draft',
          action,
          fence: this.remote?.generation?.fence ?? -1,
        })
        .catch((error) => {
          this.error = String(error)
          this.publish()
        })
      return
    }
    if (action === 'accept' && this.candidate) {
      OfficeDocument.load(this.candidate.export())
      this.promote()
    } else {
      this.candidate = undefined
      this.generation = undefined
      this.phase = 'ready'
      this.error = undefined
      this.publish()
    }
  }
  async exportFile(options: { format?: 'pptx' | 'ppt' } = {}): Promise<Blob> {
    this.alive()
    if (
      this.candidate ||
      this.remote?.generation ||
      this.collaboration?.hasPending ||
      this.phase === 'loading'
    )
      throw new Error('Cannot export during generation or loading')
    let bytes: Uint8Array = this.document.export()
    const format = options.format ?? 'pptx'
    if (format === 'ppt') {
      if (!this.options.conversion)
        throw new Error('CONVERSION_REQUIRED: 导出 PPT 需要转换服务')
      bytes = await this.options.conversion.convert(bytes, 'pptx', 'ppt')
    }
    return new Blob([bytes.slice().buffer as ArrayBuffer], {
      type:
        format === 'ppt'
          ? 'application/vnd.ms-powerpoint'
          : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    })
  }
  beginTextSession(ref: ObjectRef) {
    const state = this.remote?.texts[textKey(ref)]
    return state
      ? { ref: { ...ref }, state, epoch: this.remote!.epoch }
      : undefined
  }
  async commitTextSession(
    session: { ref: ObjectRef; state: string; epoch: number } | undefined,
    ref: ObjectRef,
    text: string
  ) {
    if (session && this.collaboration) {
      this.writable()
      return this.collaboration.request({
        kind: 'text',
        ref,
        epoch: session.epoch,
        update: textChange(session.state, text),
      })
    }
    return this.execute({ type: 'text.set', ref, text })
  }
  private waitForConnection(): Promise<void> {
    if (this.connection === 'connected') return Promise.resolve()
    return new Promise((resolve, reject) => {
      let off = () => {}
      const timer = setTimeout(() => {
        off()
        reject(new Error('Collaboration connection timed out'))
      }, 10000)
      off = this.collaboration!.onConnection((status) => {
        if (status === 'connected') {
          clearTimeout(timer)
          off()
          resolve()
        }
      })
    })
  }
  destroy() {
    this.collaboration?.disconnect()
    this.abort?.abort()
    this.sourceVersion++
    this.phase = 'destroyed'
    this.listeners.clear()
  }
}
