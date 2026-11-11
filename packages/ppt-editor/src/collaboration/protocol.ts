import type { Command, GenerationEvent, ObjectRef } from '../types.js'
export function encodeBytes(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
export function decodeBytes(value: string): Uint8Array {
  const s = atob(value)
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}
export const textKey = (ref: ObjectRef) => JSON.stringify([ref.part, ref.id])
export function encodePacket(value: unknown) {
  return JSON.stringify(value, (_k, v) =>
    v instanceof Uint8Array ? { $bytes: encodeBytes(v) } : v
  )
}
export function decodePacket(value: string) {
  return JSON.parse(value, (_k, v) =>
    v &&
    typeof v === 'object' &&
    Object.keys(v).length === 1 &&
    typeof v.$bytes === 'string'
      ? decodeBytes(v.$bytes)
      : v
  )
}
export interface RoomSnapshot {
  revision: number
  epoch: number
  pptx: string
  texts: Record<string, string>
  generation?: {
    sessionId: string
    seq: number
    fence: number
    owner: string
    error?: string
  }
  peers?: { id: string; name: string; color?: string }[]
}
export type RoomOperation =
  | { kind: 'initialize'; pptx: string }
  | { kind: 'command'; command: Command; baseRevision: number }
  | { kind: 'text'; ref: ObjectRef; update: string; epoch: number }
  | { kind: 'generation'; event: GenerationEvent; fence?: number }
  | { kind: 'cancel'; fence: number }
  | { kind: 'draft'; action: 'accept' | 'discard'; fence: number }
export interface Principal {
  id: string
  name: string
  role: 'editor' | 'viewer'
  color?: string
}
