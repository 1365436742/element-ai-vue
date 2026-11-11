import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OfficeDocument } from '../src/core/index.js'
import { EditorController } from '../src/controller.js'

test('local commands and snapshots never compress a package', async () => {
  const editor = new EditorController()
  const original = OfficeDocument.prototype.export
  OfficeDocument.prototype.export = () => {
    throw Error('Unexpected ZIP compression')
  }
  try {
    await editor.execute({ type: 'slide.add' })
    await editor.undo()
    await editor.redo()
    assert.equal(editor.getState().scene.slides.length, 2)
  } finally {
    OfficeDocument.prototype.export = original
  }
})
test('controller reads scene once until document changes and isolates caller mutation', async () => {
  const editor = new EditorController()
  const original = OfficeDocument.prototype.getScene
  let reads = 0
  OfficeDocument.prototype.getScene = function () {
    reads++
    return original.call(this)
  }
  try {
    const state = editor.getState()
    state.scene.slides.length = 0
    editor.setWorkspace('masters')
    editor.getState()
    assert.equal(editor.getState().scene.slides.length, 1)
    assert.equal(reads, 1)
    await editor.execute({ type: 'slide.add' })
    assert.equal(editor.getState().scene.slides.length, 2)
    assert.equal(reads, 2)
  } finally {
    OfficeDocument.prototype.getScene = original
  }
})
test('clones share immutable assets but keep XML and rollback independent', () => {
  const doc = OfficeDocument.create()
  const internals = doc as any
  internals.parts['opaque.bin'] = new Uint8Array([1, 2, 3])
  const clone = doc.clone()
  assert.equal(
    (clone as any).parts['opaque.bin'],
    internals.parts['opaque.bin']
  )
  const before = doc.export()
  clone.execute({ type: 'slide.add' })
  assert.deepEqual(doc.export(), before)
  const cloneBefore = clone.export()
  const apply = (clone as any).apply
  ;(clone as any).apply = function (c: any) {
    apply.call(this, c)
    this.parts['opaque.bin'] = new Uint8Array([9])
    throw Error('after mutation')
  }
  assert.throws(() => clone.execute({ type: 'slide.add' }), /after mutation/)
  assert.deepEqual(clone.export(), cloneBefore)
  assert.deepEqual(doc.export(), before)
})
test('cached generation scenes follow commands, discard and undo', async () => {
  const editor = new EditorController()
  await editor.applyGenerationEvent({
    type: 'generation.start',
    sessionId: 'cache',
    seq: 0,
    mode: 'append',
  })
  assert.equal(editor.getState().scene.slides.length, 1)
  await editor.applyGenerationEvent({
    type: 'command',
    sessionId: 'cache',
    seq: 1,
    command: { type: 'slide.add' },
  })
  assert.equal(editor.getState().scene.slides.length, 2)
  editor.resolveDraft('discard')
  assert.equal(editor.getState().scene.slides.length, 1)
  await editor.execute({ type: 'slide.add' })
  await editor.undo()
  assert.equal(editor.getState().scene.slides.length, 1)
  await editor.redo()
  assert.equal(editor.getState().scene.slides.length, 2)
})
test('rollback restores previously dirty XML and removes newly inserted parts', () => {
  const doc = OfficeDocument.create()
  doc.execute({ type: 'slide.add' })
  const before = doc.export(),
    snapshot = doc.clone()
  const apply = (doc as any).apply
  ;(doc as any).apply = function (c: any) {
    apply.call(this, c)
    throw Error('injected after apply')
  }
  assert.throws(() => doc.execute({ type: 'slide.add' }), /injected/)
  assert.deepEqual(doc.export(), before)
  assert.deepEqual(snapshot.export(), before)
  assert.deepEqual(doc.getScene(), snapshot.getScene())
})

test('unchanged slide projections survive edits while theme invalidates all pages', () => {
  const doc = OfficeDocument.create()
  doc.execute({ type: 'slide.add' })
  doc.getScene()
  const original = (doc as any).objects
  const reads: string[] = []
  ;(doc as any).objects = function (part: string, ...args: any[]) {
    reads.push(part)
    return original.call(this, part, ...args)
  }
  doc.execute({
    type: 'page.rename',
    part: 'ppt/slides/slide1.xml',
    name: 'Renamed',
  })
  assert.equal((doc.getScene().slides[0] as any).name, 'Renamed')
  assert.ok(!reads.includes('ppt/slides/slide2.xml'))
  reads.length = 0
  doc.execute({ type: 'theme.update', colors: { accent1: '#123456' } })
  doc.getScene()
  assert.ok(reads.includes('ppt/slides/slide2.xml'))
})
