import { createServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { PresentationRoom, type RoomStore } from './room.js'
import {
  decodePacket,
  encodePacket,
  type Principal,
  type RoomOperation,
} from '../collaboration/protocol.js'
import type { ConversionAdapter } from '../types.js'
export { PresentationRoom } from './room.js'
export type { RoomStore, PersistedRoom } from './room.js'
export { createFileRoomStore } from './store.js'
export { createLibreOfficeConverter } from './conversion.js'
export type { Principal } from '../collaboration/protocol.js'

export interface PresentationServerOptions {
  authenticate: (
    token: string,
    roomId: string
  ) => Promise<Principal | undefined> | Principal | undefined
  store?: RoomStore
  conversion?: ConversionAdapter
  allowedOrigins?: string[]
  maxFileBytes?: number
}
export function createPresentationServer(options: PresentationServerOptions) {
  const rooms = new Map<string, Promise<PresentationRoom>>(),
    members = new Map<
      WebSocket,
      { room: PresentationRoom; principal: Principal; token: string }
    >()
  const getRoom = (id: string) => {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('Invalid room ID')
    let value = rooms.get(id)
    if (!value) {
      value = (async () => {
        const room = new PresentationRoom(id, options.store)
        await room.restore()
        return room
      })()
      rooms.set(id, value)
      value.catch(() => rooms.delete(id))
    }
    return value
  }
  const peers = (room: PresentationRoom) => [
    ...new Map(
      [...members.values()]
        .filter((m) => m.room === room)
        .map((m) => [
          m.principal.id,
          {
            id: m.principal.id,
            name: m.principal.name,
            color: m.principal.color,
          },
        ])
    ).values(),
  ]
  const send = (ws: WebSocket, value: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      if (ws.bufferedAmount > 32 * 1024 * 1024) {
        ws.close(1013, 'Slow client')
        return
      }
      ws.send(encodePacket(value))
    }
  }
  const removeMember = (ws: WebSocket) => {
    const member = members.get(ws)
    members.delete(ws)
    return member
  }
  const closeMember = (ws: WebSocket, code: number, reason: string) => {
    const member = removeMember(ws)
    ws.close(code, reason)
    if (member) void broadcast(member.room)
  }
  const reauthenticate = async (
    ws: WebSocket,
    member: NonNullable<ReturnType<typeof removeMember>>
  ) => {
    try {
      const fresh = await options.authenticate(member.token, member.room.id)
      if (members.get(ws) !== member || ws.readyState !== WebSocket.OPEN) return
      if (!fresh || fresh.id !== member.principal.id) {
        closeMember(ws, 1008, 'Permission revoked')
        return
      }
      member.principal = fresh
      return fresh
    } catch {
      closeMember(ws, 1011, 'Authorization unavailable')
    }
  }
  const sendSnapshot = (ws: WebSocket, room: PresentationRoom) =>
    send(ws, {
      type: 'snapshot',
      snapshot: { ...room.snapshot(), peers: peers(room) },
    })
  const broadcast = async (room: PresentationRoom) => {
    await Promise.all(
      [...members]
        .filter(([, member]) => member.room === room)
        .map(async ([ws, member]) => {
          if ((await reauthenticate(ws, member)) && members.get(ws) === member)
            // Read the committed state at delivery time, after async authorization.
            sendSnapshot(ws, room)
        })
    )
  }
  const server = createServer(async (req, res) => {
    const origin = req.headers.origin
    if (origin && options.allowedOrigins?.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      )
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(
        origin && options.allowedOrigins?.includes(origin) ? 204 : 403
      )
      res.end()
      return
    }
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"ok":true}')
      return
    }
    if (url.pathname !== '/convert' || req.method !== 'POST') {
      res.writeHead(404)
      res.end()
      return
    }
    try {
      const principal = await options.authenticate(
        (req.headers.authorization ?? '').replace(/^Bearer /i, ''),
        'conversion'
      )
      if (principal?.role !== 'editor') {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }
      if (!options.conversion) {
        res.writeHead(503)
        res.end('CONVERSION_REQUIRED: configure LibreOffice')
        return
      }
      const from = url.searchParams.get('from'),
        to = url.searchParams.get('to')
      if (
        !['ppt', 'pptx'].includes(from ?? '') ||
        !['ppt', 'pptx'].includes(to ?? '')
      )
        throw new Error('Invalid format')
      const abort = new AbortController()
      req.on('aborted', () => abort.abort())
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > (options.maxFileBytes ?? 100 * 1024 * 1024)) {
          res.writeHead(413)
          res.end('File too large')
          return
        }
        chunks.push(chunk)
      }
      const output = await options.conversion.convert(
        new Uint8Array(Buffer.concat(chunks)),
        from as 'ppt' | 'pptx',
        to as 'ppt' | 'pptx',
        abort.signal
      )
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': output.length,
        'X-Content-Type-Options': 'nosniff',
      })
      res.end(output)
    } catch (error) {
      res.writeHead(422)
      res.end(error instanceof Error ? error.message : 'Conversion failed')
    }
  })
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 32 * 1024 * 1024,
  })
  server.on('upgrade', (request, socket, head) => {
    if (
      new URL(request.url ?? '/', 'http://localhost').pathname !==
        '/collaboration' ||
      (request.headers.origin &&
        options.allowedOrigins &&
        !options.allowedOrigins.includes(request.headers.origin))
    ) {
      socket.destroy()
      return
    }
    wss.handleUpgrade(request, socket, head, (ws) =>
      wss.emit('connection', ws, request)
    )
  })
  wss.on('connection', (ws) => {
    const timer = setTimeout(() => {
      if (!members.has(ws)) ws.close(1008, 'Authentication required')
    }, 10000)
    let chain = Promise.resolve()
    ws.on('message', (data) => {
      chain = chain
        .then(async () => {
          let request: any
          let authorizedMember: ReturnType<typeof removeMember>
          try {
            request = decodePacket(data.toString())
            if (request.type === 'join') {
              if (members.has(ws)) throw new Error('Already joined')
              const principal = await options.authenticate(
                request.token,
                request.roomId
              )
              if (!principal) throw new Error('FORBIDDEN')
              const room = await getRoom(request.roomId)
              if (ws.readyState !== WebSocket.OPEN) return
              members.set(ws, { room, principal, token: request.token })
              clearTimeout(timer)
              send(ws, { type: 'joined', principal })
              await broadcast(room)
              return
            }
            const member = members.get(ws)
            if (!member) throw new Error('Authentication required')
            const fresh = await reauthenticate(ws, member)
            if (!fresh || members.get(ws) !== member) return
            authorizedMember = member
            if (request.type !== 'operation') throw new Error('Unknown request')
            const result = await member.room.apply(
              fresh,
              request.opId,
              request.operation as RoomOperation
            )
            await broadcast(member.room)
            send(ws, { type: 'ack', opId: request.opId, result })
          } catch (error) {
            send(ws, {
              type: 'error',
              opId: request?.opId,
              message:
                error instanceof Error ? error.message : 'Invalid request',
            })
            if (authorizedMember && members.get(ws) === authorizedMember)
              sendSnapshot(ws, authorizedMember.room)
          }
        })
        .catch(() => ws.close(1011, 'Connection failed'))
    })
    ws.on('close', () => {
      clearTimeout(timer)
      const member = removeMember(ws)
      if (member) void broadcast(member.room)
    })
    ws.on('error', () => {})
  })
  return {
    server,
    wss,
    async listen(port = 8787, host = '127.0.0.1') {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, host, () => {
          server.off('error', reject)
          resolve()
        })
      })
      return server.address()
    },
    async close() {
      for (const ws of wss.clients) ws.terminate()
      await new Promise<void>((resolve) => wss.close(() => resolve()))
      if (server.listening)
        await new Promise<void>((resolve, reject) =>
          server.close((e) => (e ? reject(e) : resolve()))
        )
    },
  }
}
