import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readGenerationStream } from '../src/stream/index.js'

function chunks(text: string) {
  const bytes = new TextEncoder().encode(text)
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += 3)
        controller.enqueue(bytes.slice(i, i + 3))
      controller.close()
    },
  })
}
test('NDJSON preserves Chinese text split across byte chunks and the final unterminated line', async () => {
  const events = []
  for await (const event of readGenerationStream(
    chunks(
      '{"type":"generation.start","sessionId":"a","seq":0,"title":"季度汇报"}\n{"type":"generation.complete","sessionId":"a","seq":1}'
    )
  ))
    events.push(event)
  assert.equal(events.length, 2)
  assert.equal((events[0] as any).title, '季度汇报')
})
test('SSE accepts CRLF and comments without treating transport end as generation completion', async () => {
  const events = []
  for await (const event of readGenerationStream(
    chunks(
      ': heartbeat\r\ndata: {"type":"generation.start","sessionId":"a","seq":0}\r\n\r\n'
    ),
    'sse'
  ))
    events.push(event)
  assert.deepEqual(events, [
    { type: 'generation.start', sessionId: 'a', seq: 0 },
  ])
})
test('stream rejects unbounded lines and malformed event envelopes', async () => {
  await assert.rejects(async () => {
    for await (const _ of readGenerationStream(
      chunks('x'.repeat(100)),
      'ndjson',
      { maxEventBytes: 30 }
    )) {
    }
  }, /limit/i)
  await assert.rejects(async () => {
    for await (const _ of readGenerationStream(chunks('{"seq":-1}'))) {
    }
  }, /event/i)
})

test('framed generation events decode binary image resources without losing their bytes', async () => {
  const payload = {
    type: 'command',
    sessionId: 'image',
    seq: 1,
    command: {
      type: 'object.add',
      part: 'ppt/slides/slide1.xml',
      object: {
        kind: 'image',
        data: { $bytes: 'AAH+/w==' },
        mimeType: 'image/png',
        frame: { x: 0, y: 0, width: 100, height: 100 },
      },
    },
  }
  const events = []
  for await (const event of readGenerationStream(
    chunks(JSON.stringify(payload) + '\n')
  ))
    events.push(event)
  assert.deepEqual(
    (events[0] as any).command.object.data,
    new Uint8Array([0, 1, 254, 255])
  )
})

test('event byte limits count UTF-8 bytes rather than JavaScript characters', async () => {
  const payload = JSON.stringify({
    type: 'generation.start',
    sessionId: 'utf8',
    seq: 0,
    title: '中'.repeat(30),
  })
  await assert.rejects(async () => {
    for await (const _ of readGenerationStream(chunks(payload), 'ndjson', {
      maxEventBytes: payload.length + 5,
    })) {
    }
  }, /limit/i)
})
