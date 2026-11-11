import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PresentationRoom,
  type RoomStore,
  type PersistedRoom,
} from '../src/server/room.js'
import { OfficeDocument } from '../src/core/index.js'
import { decodeBytes, textKey } from '../src/collaboration/protocol.js'
import { textChange } from '../src/collaboration/text.js'
const alice = { id: 'a', name: 'Alice', role: 'editor' as const },
  bob = { id: 'b', name: 'Bob', role: 'editor' as const }

test('owner cancellation retains a globally locked draft until accept or discard', async () => {
  const room = new PresentationRoom('cancel')
  const lease = (await room.apply(alice, 'start', {
    kind: 'generation',
    event: { type: 'generation.start', sessionId: 's', seq: 0 },
  })) as { fence: number }
  await room.apply(alice, 'cancel', {
    kind: 'cancel',
    fence: lease.fence,
  } as any)
  assert.match((room.snapshot().generation as any)?.error, /cancel/i)
  await assert.rejects(
    room.apply(bob, 'human', {
      kind: 'command',
      baseRevision: 0,
      command: { type: 'slide.add' },
    }),
    /LOCKED/
  )
  await assert.rejects(
    room.apply(alice, 'late', {
      kind: 'generation',
      fence: lease.fence,
      event: {
        type: 'command',
        sessionId: 's',
        seq: 1,
        command: { type: 'slide.add' },
      },
    }),
    /cancel|interrupted/i
  )
  await room.apply(alice, 'discard', {
    kind: 'draft',
    action: 'discard',
    fence: lease.fence,
  })
  assert.equal(room.snapshot().generation, undefined)
})

test('completed generation events can be replayed after durable restart with a new operation ID', async () => {
  let data: PersistedRoom | undefined
  const store: RoomStore = {
    load: async () => data,
    save: async (_id, value) => {
      data = structuredClone(value)
    },
  }
  const room = new PresentationRoom('replay', store)
  const lease = (await room.apply(alice, 'start', {
    kind: 'generation',
    event: { type: 'generation.start', sessionId: 's', seq: 0 },
  })) as { fence: number }
  const event = { type: 'generation.complete' as const, sessionId: 's', seq: 1 }
  await room.apply(alice, 'done', {
    kind: 'generation',
    fence: lease.fence,
    event,
  })
  const restored = new PresentationRoom('replay', store)
  await restored.restore()
  await restored.apply(alice, 'done-retry', {
    kind: 'generation',
    fence: lease.fence,
    event,
  })
  assert.equal(restored.snapshot().revision, 1)
})
test('two concurrent text edits merge while stale shape edits and viewer writes are rejected', async () => {
  const room = new PresentationRoom('r'),
    part = 'ppt/slides/slide1.xml',
    ref = { part, id: '2' }
  await room.apply(alice, 'add', {
    kind: 'command',
    baseRevision: 0,
    command: {
      type: 'object.add',
      part,
      object: {
        kind: 'text',
        id: '2',
        text: 'Hello',
        frame: { x: 0, y: 0, width: 100, height: 50 },
      },
    },
  })
  const state = room.snapshot(),
    base = state.texts[textKey(ref)]!
  await Promise.all([
    room.apply(alice, 'a', {
      kind: 'text',
      ref,
      epoch: 0,
      update: textChange(base, 'Hello A'),
    }),
    room.apply(bob, 'b', {
      kind: 'text',
      ref,
      epoch: 0,
      update: textChange(base, 'Hello B'),
    }),
  ])
  const text = OfficeDocument.load(decodeBytes(room.snapshot().pptx)).getScene()
    .slides[0]!.objects[0]!.text!
  assert.ok(text.includes(' A'))
  assert.ok(text.includes(' B'))
  await assert.rejects(
    room.apply(bob, 'stale', {
      kind: 'command',
      baseRevision: 0,
      command: { type: 'slide.add' },
    }),
    /CONFLICT/
  )
  await assert.rejects(
    room.apply({ ...bob, role: 'viewer' }, 'view', {
      kind: 'command',
      baseRevision: 3,
      command: { type: 'slide.add' },
    }),
    /FORBIDDEN/
  )
})
test('generation lock, fencing and persisted candidate survive room restart', async () => {
  let stored: PersistedRoom | undefined
  const store: RoomStore = {
    load: async () => stored,
    save: async (_id, value) => {
      stored = structuredClone(value)
    },
  }
  const room = new PresentationRoom('r', store)
  const lease = (await room.apply(alice, 'start', {
    kind: 'generation',
    event: { type: 'generation.start', sessionId: 's', seq: 0 },
  })) as { fence: number }
  await assert.rejects(
    room.apply(bob, 'edit', {
      kind: 'command',
      baseRevision: 0,
      command: { type: 'slide.add' },
    }),
    /LOCKED/
  )
  const restored = new PresentationRoom('r', store)
  await restored.restore()
  assert.equal(restored.snapshot().generation?.owner, 'a')
  await assert.rejects(
    restored.apply(bob, 'steal', {
      kind: 'draft',
      action: 'discard',
      fence: lease.fence,
    }),
    /LEASE/
  )
  await restored.apply(alice, 'complete', {
    kind: 'generation',
    fence: lease.fence,
    event: { type: 'generation.complete', sessionId: 's', seq: 1 },
  })
  assert.equal(restored.snapshot().generation, undefined)
  assert.equal(restored.snapshot().epoch, 1)
})
test('persistence failure rolls back OOXML, revision and operation deduplication atomically', async () => {
  const room = new PresentationRoom('r', {
    load: async () => undefined,
    save: async () => {
      throw new Error('disk full')
    },
  })
  const before = room.snapshot()
  await assert.rejects(
    room.apply(alice, 'add', {
      kind: 'command',
      baseRevision: 0,
      command: { type: 'slide.add' },
    }),
    /disk full/
  )
  assert.deepEqual(room.snapshot(), before)
})
test('a repeated opId is idempotent and cannot be reused with a different command', async () => {
  const room = new PresentationRoom('r'),
    op = {
      kind: 'command' as const,
      baseRevision: 0,
      command: { type: 'slide.add' as const },
    }
  await room.apply(alice, 'add', op)
  await room.apply(alice, 'add', op)
  assert.equal(room.snapshot().revision, 1)
  await assert.rejects(
    room.apply(alice, 'add', {
      ...op,
      command: { type: 'slide.delete', part: 'ppt/slides/slide1.xml' },
    }),
    /reused/
  )
})

test('snapshot remains committed while a checkpoint is pending or fails', async () => {
  let beginSave!: () => void
  const saving = new Promise<void>((resolve) => {
    beginSave = resolve
  })
  let rejectSave!: (error: Error) => void
  const save = new Promise<void>((_resolve, reject) => {
    rejectSave = reject
  })
  const room = new PresentationRoom('pending', {
    load: async () => undefined,
    save: () => {
      beginSave()
      return save
    },
  })
  const original = room.snapshot()
  const request = room.apply(
    { id: 'owner', name: 'Owner', role: 'editor' },
    'pending',
    {
      kind: 'command',
      baseRevision: 0,
      command: { type: 'slide.add' },
    }
  )
  await saving
  const duringSave = room.snapshot()
  rejectSave(new Error('checkpoint failed'))
  await assert.rejects(request, /checkpoint failed/)
  assert.deepEqual(duringSave, original)
  assert.deepEqual(room.snapshot(), original)
})
