import type { GenerationEvent, ConversionAdapter } from '../types.js'
import { encodePacket, decodePacket } from '../collaboration/protocol.js'

export function parseGenerationEvent(value: unknown): GenerationEvent {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid generation event')
  const event = value as GenerationEvent
  if (
    ![
      'generation.start',
      'command',
      'generation.complete',
      'generation.error',
    ].includes(event.type) ||
    typeof event.sessionId !== 'string' ||
    !event.sessionId ||
    !Number.isSafeInteger(event.seq) ||
    event.seq < 0
  )
    throw new Error('Invalid generation event envelope')
  if (
    event.type === 'command' &&
    (!event.command || typeof event.command.type !== 'string')
  )
    throw new Error('Invalid command event')
  return event
}

export function encodeGenerationEvent(event: GenerationEvent): string {
  return encodePacket(parseGenerationEvent(event))
}

/** Transport framing is custom; document payloads always become standard OOXML parts. */
export async function* readGenerationStream(
  stream: ReadableStream<Uint8Array>,
  format: 'ndjson' | 'sse' = 'ndjson',
  options: { signal?: AbortSignal; maxEventBytes?: number } = {}
): AsyncGenerator<GenerationEvent> {
  const reader = stream.getReader(),
    decoder = new TextDecoder('utf-8', { fatal: true })
  const limit = options.maxEventBytes ?? 4 * 1024 * 1024
  let buffer = '',
    data: string[] = []
  const abort = () => {
    void reader.cancel(options.signal?.reason)
  }
  options.signal?.addEventListener('abort', abort, { once: true })
  const encoder = new TextEncoder()
  const bytes = (value: string) => encoder.encode(value).byteLength
  function consume(line: string): GenerationEvent | undefined {
    if (bytes(line) > limit) throw new Error('Event size limit exceeded')
    if (format === 'ndjson')
      return line.trim() ? parseGenerationEvent(decodePacket(line)) : undefined
    if (line === '') {
      const body = data.join('\n')
      data = []
      return body ? parseGenerationEvent(decodePacket(body)) : undefined
    }
    if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
    if (data.reduce((n, l) => n + bytes(l) + 1, 0) > limit)
      throw new Error('Event size limit exceeded')
  }
  try {
    while (true) {
      options.signal?.throwIfAborted()
      const { value, done } = await reader.read()
      options.signal?.throwIfAborted()
      buffer += decoder.decode(value, { stream: !done })
      let end: number
      while ((end = buffer.indexOf('\n')) !== -1) {
        if (end > limit) throw new Error('Event size limit exceeded')
        const line = buffer.slice(0, end).replace(/\r$/, '')
        buffer = buffer.slice(end + 1)
        const event = consume(line)
        if (event) yield event
      }
      if (bytes(buffer) > limit) throw new Error('Event size limit exceeded')
      if (done) break
    }
    if (buffer) {
      const event = consume(buffer.replace(/\r$/, ''))
      if (event) yield event
    }
    if (format === 'sse') {
      const event = consume('')
      if (event) yield event
    }
  } finally {
    options.signal?.removeEventListener('abort', abort)
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

export function createHttpConversionAdapter(
  url: string,
  options: { headers?: HeadersInit; maxBytes?: number } = {}
): ConversionAdapter {
  return {
    async convert(input, from, to, signal) {
      const target = new URL(
        url,
        typeof location === 'undefined' ? undefined : location.href
      )
      target.searchParams.set('from', from)
      target.searchParams.set('to', to)
      const response = await fetch(target, {
        method: 'POST',
        headers: {
          ...Object.fromEntries(new Headers(options.headers)),
          'Content-Type': 'application/octet-stream',
        },
        body: input.slice().buffer,
        signal,
      })
      if (!response.ok)
        throw new Error(
          `Conversion failed (${response.status}): ${(await response.text()).slice(0, 500)}`
        )
      if (!response.body) throw new Error('Conversion returned no file')
      return readBinary(response.body, options.maxBytes, signal)
    },
  }
}

export async function readBinary(
  stream: ReadableStream<Uint8Array>,
  maxBytes = 100 * 1024 * 1024,
  signal?: AbortSignal
): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  const abort = () => {
    void reader.cancel(signal?.reason)
  }
  signal?.addEventListener('abort', abort, { once: true })
  try {
    while (true) {
      signal?.throwIfAborted()
      const result = await reader.read()
      signal?.throwIfAborted()
      if (result.done) break
      size += result.value.length
      if (size > maxBytes) throw new Error('File size limit exceeded')
      chunks.push(result.value)
    }
  } finally {
    signal?.removeEventListener('abort', abort)
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
  const output = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }
  return output
}
