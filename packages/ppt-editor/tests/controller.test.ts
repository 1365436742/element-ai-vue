import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EditorController } from '../src/controller.js'

test('generation locks edits, deduplicates replay and only promotes on explicit completion', async () => {
  const editor = new EditorController()
  const before = await editor.exportFile()
  await editor.applyGenerationEvent({
    type: 'generation.start',
    sessionId: 's',
    seq: 0,
    mode: 'replace',
  })
  assert.equal(editor.getState().editable, false)
  await assert.rejects(editor.execute({ type: 'slide.add' }), /read.only/i)
  await assert.rejects(editor.exportFile(), /generation/i)
  const event = {
    type: 'command' as const,
    sessionId: 's',
    seq: 1,
    command: { type: 'slide.add' as const },
  }
  await editor.applyGenerationEvent(event)
  await editor.applyGenerationEvent(event)
  assert.equal(editor.getState().scene.slides.length, 2)
  await assert.rejects(
    editor.applyGenerationEvent({
      type: 'generation.complete',
      sessionId: 's',
      seq: 3,
    }),
    /sequence/i
  )
  editor.resolveDraft('discard')
  assert.deepEqual(
    new Uint8Array(await (await editor.exportFile()).arrayBuffer()),
    new Uint8Array(await before.arrayBuffer())
  )
})
test('stream EOF does not unlock incomplete generation or replace the committed document', async () => {
  const editor = new EditorController()
  async function* events() {
    yield { type: 'generation.start' as const, sessionId: 's', seq: 0 }
  }
  await assert.rejects(
    editor.open({ type: 'events', events: events() }),
    /complete/i
  )
  assert.equal(editor.getState().editable, false)
  editor.resolveDraft('discard')
  assert.equal(editor.getState().editable, true)
})
test('undo restores accepted local commands and redo restores the same new slide', async () => {
  const editor = new EditorController()
  await editor.execute({ type: 'slide.add' })
  const parts = editor.getState().scene.slides.map((s) => s.part)
  await editor.undo()
  assert.equal(editor.getState().scene.slides.length, 1)
  await editor.redo()
  assert.deepEqual(
    editor.getState().scene.slides.map((s) => s.part),
    parts
  )
})
test('readonly option blocks mutation even after opening a new document', async () => {
  const editor = new EditorController({ editable: false })
  await editor.open({ type: 'new' })
  await assert.rejects(editor.execute({ type: 'slide.add' }), /read.only/i)
})

test('cancelled local generation rejects late packets and retains its draft until resolution', async () => {
  const editor = new EditorController()
  await editor.applyGenerationEvent({
    type: 'generation.start',
    sessionId: 'cancelled',
    seq: 0,
  })
  await editor.applyGenerationEvent({
    type: 'command',
    sessionId: 'cancelled',
    seq: 1,
    command: { type: 'slide.add' },
  })
  editor.cancelGeneration()
  await assert.rejects(
    editor.applyGenerationEvent({
      type: 'generation.complete',
      sessionId: 'cancelled',
      seq: 2,
    }),
    /interrupted|cancelled/i
  )
  assert.equal(editor.getState().editable, false)
  assert.equal(editor.getState().scene.slides.length, 2)
  editor.resolveDraft('accept')
  assert.equal(editor.getState().editable, true)
  assert.equal(editor.getState().scene.slides.length, 2)
})

test('opening another source cannot silently discard an active generation draft', async () => {
  const editor = new EditorController()
  await editor.applyGenerationEvent({
    type: 'generation.start',
    sessionId: 'draft',
    seq: 0,
  })
  await editor.applyGenerationEvent({
    type: 'command',
    sessionId: 'draft',
    seq: 1,
    command: { type: 'slide.add' },
  })
  await assert.rejects(editor.open({ type: 'new' }), /draft/i)
  assert.equal(editor.getState().generation?.sessionId, 'draft')
  assert.equal(editor.getState().scene.slides.length, 2)
  editor.resolveDraft('discard')
  await editor.open({ type: 'new' })
  assert.equal(editor.getState().scene.slides.length, 1)
})
