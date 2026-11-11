import {
  decodePacket,
  encodePacket,
  type RoomOperation,
  type RoomSnapshot,
  type Principal,
} from './protocol.js'
import type { CollaborationOptions } from '../types.js'
export { textChange, textState, loadText } from './text.js'
export { encodeBytes, decodeBytes, textKey } from './protocol.js'
export type { RoomSnapshot, RoomOperation, Principal } from './protocol.js'

export class CollaborationClient {
  snapshot?: RoomSnapshot
  principal?: Principal
  private socket?: WebSocket
  private stopped = false
  private retry?: ReturnType<typeof setTimeout>
  private attempt = 0
  private pending = new Map<
    string,
    {
      resolve: (result: any) => void
      reject: (error: Error) => void
      timer: ReturnType<typeof setTimeout>
    }
  >()
  private listeners = new Set<(snapshot: RoomSnapshot) => void>()
  private connectionListeners = new Set<
    (status: 'offline' | 'connecting' | 'connected') => void
  >()
  private status: 'offline' | 'connecting' | 'connected' = 'offline'
  constructor(
    private options: CollaborationOptions,
    private Socket: typeof WebSocket = WebSocket
  ) {}
  connect() {
    if (this.stopped || (this.socket && this.socket.readyState < 2)) return
    this.setStatus('connecting')
    const ws = new this.Socket(this.options.url)
    this.socket = ws
    ws.addEventListener('open', () =>
      ws.send(
        encodePacket({
          type: 'join',
          roomId: this.options.roomId,
          token: this.options.token,
        })
      )
    )
    ws.addEventListener('message', (event) => {
      try {
        const packet = decodePacket(String(event.data))
        if (packet.type === 'joined') this.principal = packet.principal
        else if (packet.type === 'snapshot') {
          this.snapshot = packet.snapshot
          this.attempt = 0
          this.setStatus('connected')
          this.listeners.forEach((fn) => fn(packet.snapshot))
        } else if (packet.type === 'ack' || packet.type === 'error') {
          const pending = this.pending.get(packet.opId)
          if (pending) {
            clearTimeout(pending.timer)
            this.pending.delete(packet.opId)
            if (packet.type === 'ack') pending.resolve(packet.result)
            else pending.reject(new Error(packet.message))
          } else if (packet.type === 'error' && !this.principal) {
            ws.close()
          }
        }
      } catch {
        ws.close(1002, 'Invalid server message')
      }
    })
    ws.addEventListener('close', () => {
      if (this.socket !== ws) return
      this.setStatus('offline')
      this.pending.forEach((p) => {
        clearTimeout(p.timer)
        p.reject(new Error('Disconnected; local draft retained'))
      })
      this.pending.clear()
      if (!this.stopped)
        this.retry = setTimeout(
          () => this.connect(),
          Math.min(10000, 500 * 2 ** this.attempt++)
        )
    })
    ws.addEventListener('error', () => {})
  }
  private setStatus(status: typeof this.status) {
    this.status = status
    this.connectionListeners.forEach((fn) => fn(status))
  }
  onSnapshot(fn: (snapshot: RoomSnapshot) => void) {
    this.listeners.add(fn)
    if (this.snapshot) fn(this.snapshot)
    return () => {
      this.listeners.delete(fn)
    }
  }
  onConnection(fn: (status: typeof this.status) => void) {
    this.connectionListeners.add(fn)
    fn(this.status)
    return () => {
      this.connectionListeners.delete(fn)
    }
  }
  request(operation: RoomOperation): Promise<any> {
    if (this.status !== 'connected' || this.socket?.readyState !== 1)
      return Promise.reject(new Error('Collaboration is not connected'))
    const opId = crypto.randomUUID()
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(opId)
        reject(
          new Error(
            'Operation timed out; review the server snapshot before retrying'
          )
        )
      }, 20000)
      this.pending.set(opId, { resolve, reject, timer })
      this.socket!.send(encodePacket({ type: 'operation', opId, operation }))
    })
  }
  get hasPending() {
    return this.pending.size > 0
  }
  disconnect() {
    this.stopped = true
    clearTimeout(this.retry)
    this.socket?.close()
    this.listeners.clear()
    this.connectionListeners.clear()
    this.pending.forEach((p) => {
      clearTimeout(p.timer)
      p.reject(new Error('Client detached'))
    })
    this.pending.clear()
  }
}
