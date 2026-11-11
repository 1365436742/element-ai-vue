import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WebSocket } from 'ws'
import { mkdtemp, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createPresentationServer,
  createFileRoomStore,
  createLibreOfficeConverter,
} from '../src/server/index.js'
import { CollaborationClient } from '../src/collaboration/index.js'
import { decodeBytes } from '../src/collaboration/protocol.js'
import { OfficeDocument } from '../src/core/index.js'
import { EditorController } from '../src/controller.js'

async function connected(client: CollaborationClient) {
  return new Promise<void>((resolve, reject) => {
    let off = () => {}
    const timeout = setTimeout(() => {
      off()
      reject(new Error('connect timeout'))
    }, 3000)
    off = client.onConnection((status) => {
      if (status === 'connected') {
        clearTimeout(timeout)
        off()
        resolve()
      }
    })
    client.connect()
  })
}
test('real WebSocket clients converge and a durable checkpoint restores after restart', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ppt-room-test-'))
  const opts = {
    authenticate: (token: string) => ({
      id: token,
      name: token,
      role: token === 'viewer' ? ('viewer' as const) : ('editor' as const),
    }),
    store: createFileRoomStore(dir),
  }
  const service = createPresentationServer(opts)
  const address = (await service.listen(0)) as { port: number }
  const clients = ['alice', 'bob', 'viewer'].map(
    (token) =>
      new CollaborationClient(
        {
          url: `ws://127.0.0.1:${address.port}/collaboration`,
          roomId: 'test',
          token,
          user: { id: token, name: token },
        },
        WebSocket as unknown as typeof globalThis.WebSocket
      )
  )
  try {
    await Promise.all(clients.map(connected))
    await clients[0]!.request({
      kind: 'command',
      baseRevision: 0,
      command: { type: 'slide.add' },
    })
    await assert.rejects(
      clients[2]!.request({
        kind: 'command',
        baseRevision: 1,
        command: { type: 'slide.add' },
      }),
      /FORBIDDEN/
    )
    assert.equal(clients[1]!.snapshot?.revision, 1)
    assert.equal(
      OfficeDocument.load(decodeBytes(clients[1]!.snapshot!.pptx)).getScene()
        .slides.length,
      2
    )
    clients.forEach((c) => c.disconnect())
    await service.close()
    const again = createPresentationServer(opts),
      newAddress = (await again.listen(0)) as { port: number }
    const reader = new CollaborationClient(
      {
        url: `ws://127.0.0.1:${newAddress.port}/collaboration`,
        roomId: 'test',
        token: 'alice',
        user: { id: 'alice', name: 'alice' },
      },
      WebSocket as unknown as typeof globalThis.WebSocket
    )
    try {
      await connected(reader)
      assert.equal(reader.snapshot?.revision, 1)
    } finally {
      reader.disconnect()
      await again.close()
    }
    assert.deepEqual(
      (await readdir(dir)).filter((n) => n.endsWith('.json')),
      ['test.json']
    )
  } finally {
    clients.forEach((c) => c.disconnect())
    await service.close()
    await rm(dir, { recursive: true, force: true })
  }
})
test('missing LibreOffice fails explicitly instead of returning an empty successful document', async () => {
  const converter = createLibreOfficeConverter({
    binary: '/nonexistent/element-ppt-test-soffice',
    timeoutMs: 100,
  })
  await assert.rejects(
    converter.convert(new Uint8Array([0xd0, 0xcf]), 'ppt', 'pptx'),
    /CONVERSION_FAILED/
  )
})

function gate() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })
  return { promise, release }
}

const editorPrincipal = (token: string) => ({
  id: token,
  name: token,
  role: 'editor' as const,
})
const start = {
  type: 'generation.start',
  sessionId: 'session',
  seq: 0,
} as const

async function roomFixture(
  t: import('node:test').TestContext,
  options: Parameters<typeof createPresentationServer>[0]
) {
  const service = createPresentationServer(options)
  const address = (await service.listen(0)) as { port: number }
  const url = `ws://127.0.0.1:${address.port}/collaboration`
  const clients: CollaborationClient[] = []
  const connection = (token: string) => ({
    url,
    roomId: 'test',
    token,
    user: editorPrincipal(token),
  })
  t.after(async () => {
    clients.forEach((client) => client.disconnect())
    await service.close()
  })
  return {
    connection,
    async join(token: string) {
      const client = new CollaborationClient(
        connection(token),
        WebSocket as unknown as typeof globalThis.WebSocket
      )
      clients.push(client)
      await connected(client)
      return client
    },
  }
}

test(
  'throwing operation authenticator disconnects without sending a snapshot',
  { timeout: 5000 },
  async (t) => {
    let fail = false
    const room = await roomFixture(t, {
      authenticate(token) {
        if (fail) throw new Error('auth provider failed')
        return editorPrincipal(token)
      },
    })
    const client = await room.join('alice')
    await client.request({ kind: 'generation', event: start })
    const offline = gate()
    client.onConnection((status) => {
      if (status === 'offline') offline.release()
    })
    let snapshots = 0
    client.onSnapshot(() => {
      snapshots++
    })
    fail = true
    await assert.rejects(
      client.request({
        kind: 'cancel',
        fence: client.snapshot!.generation!.fence,
      }),
      /Disconnected/
    )
    await offline.promise
    assert.equal(snapshots, 1)
  }
)

test(
  'joining during a failed checkpoint sees the committed document',
  { timeout: 5000 },
  async (t) => {
    const entered = gate()
    const release = gate()
    const room = await roomFixture(t, {
      authenticate: editorPrincipal,
      store: {
        load: async () => undefined,
        async save() {
          entered.release()
          await release.promise
          throw new Error('save failed')
        },
      },
    })
    const owner = await room.join('alice')
    const failed = assert.rejects(
      owner.request({ kind: 'generation', event: start }),
      /save failed/
    )
    await entered.promise
    try {
      const observer = await room.join('bob')
      assert.equal(observer.snapshot?.generation, undefined)
    } finally {
      release.release()
      await failed
    }
  }
)

test(
  'reversed authorization completion cannot roll back draft cancellation',
  { timeout: 5000 },
  async (t) => {
    const entered = gate()
    const release = gate()
    let delayNextObserver = false
    const room = await roomFixture(t, {
      async authenticate(token) {
        if (token === 'observer' && delayNextObserver) {
          delayNextObserver = false
          entered.release()
          await release.promise
        }
        return editorPrincipal(token)
      },
    })
    const owner = await room.join('alice')
    const observer = await room.join('observer')
    const otherTab = await room.join('alice')
    delayNextObserver = true
    const starting = owner.request({ kind: 'generation', event: start })
    await entered.promise
    try {
      const fence = otherTab.snapshot!.generation?.fence
      // The other tab may still be receiving the start broadcast.
      const lease =
        fence ??
        (await new Promise<number>((resolve) => {
          otherTab.onSnapshot((snapshot) => {
            if (snapshot.generation) resolve(snapshot.generation.fence)
          })
        }))
      const cancelled = gate()
      observer.onSnapshot((snapshot) => {
        if (snapshot.generation?.error) cancelled.release()
      })
      await otherTab.request({ kind: 'cancel', fence: lease })
      await cancelled.promise
      // Observe the delayed broadcast by waiting for the originating ack, then
      // send a round-trip marker on the observer socket after that delivery.
      release.release()
      await starting
      let rollback = false
      const off = observer.onSnapshot((snapshot) => {
        if (!snapshot.generation?.error) rollback = true
      })
      await assert.rejects(
        observer.request({
          kind: 'command',
          baseRevision: 0,
          command: { type: 'slide.add' },
        }),
        /GENERATION_LOCKED/
      )
      off()
      assert.equal(rollback, false)
    } finally {
      release.release()
    }
  }
)

test(
  'controller cancels a collaborative start while its lease is still pending',
  { timeout: 5000 },
  async (t) => {
    const entered = gate()
    const release = gate()
    const room = await roomFixture(t, {
      authenticate: editorPrincipal,
      store: {
        load: async () => undefined,
        async save() {
          entered.release()
          await release.promise
        },
      },
    })
    const controller = new EditorController({
      collaboration: room.connection('alice'),
    })
    t.after(() => controller.destroy())
    const starting = controller.applyGenerationEvent(start)
    await entered.promise
    controller.cancelGeneration()
    release.release()
    await starting
    const cancellation = await new Promise<string>((resolve) => {
      const off = controller.subscribe((state) => {
        if (state.error) {
          queueMicrotask(() => off())
          resolve(state.error)
        }
      })
    })
    assert.match(cancellation, /draft retained/)
    assert.equal(controller.getState().phase, 'error')
  }
)
