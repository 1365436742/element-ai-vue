import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OfficeDocument } from '../src/core/index.js'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
const part = 'ppt/slides/slide1.xml'
test('background gradients preserve gradient stops, focus rectangle and theme color transforms', () => {
  const doc = OfficeDocument.create()
  const parts = unzipSync(doc.export())
  parts[part] = strToU8(
    strFromU8(parts[part]!).replace(
      '<p:spTree>',
      '<p:bg><p:bgPr><a:gradFill><a:gsLst><a:gs pos="0"><a:srgbClr val="002060"/></a:gs><a:gs pos="100000"><a:srgbClr val="7030A0"/></a:gs></a:gsLst><a:path path="rect"><a:fillToRect l="100000" t="100000"/></a:path></a:gradFill></p:bgPr></p:bg><p:spTree>'
    )
  )
  const paint = OfficeDocument.load(zipSync(parts)).getScene().slides[0]!
    .backgroundPaint
  assert.equal(paint?.kind, 'gradient')
  if (paint?.kind !== 'gradient') return
  assert.deepEqual(paint.stops, [
    { offset: 0, color: '#002060' },
    { offset: 1, color: '#7030A0' },
  ])
  assert.equal(paint.path, 'rect')
  assert.equal(paint.focus.left, 1)
  assert.equal(paint.focus.top, 1)
})
test('shape gradient fills are replaced only by explicit fill edits', () => {
  const doc = OfficeDocument.create()
  const ref = doc.execute({
    type: 'object.add',
    part,
    object: { kind: 'shape', frame: { x: 0, y: 0, width: 100, height: 100 } },
  }).ref!
  const parts = unzipSync(doc.export())
  parts[part] = strToU8(
    strFromU8(parts[part]!).replace(
      '</p:spPr>',
      '<a:gradFill><a:gsLst><a:gs pos="0"><a:srgbClr val="FF0000"/></a:gs><a:gs pos="100000"><a:srgbClr val="0000FF"/></a:gs></a:gsLst><a:lin ang="0" scaled="1"/></a:gradFill></p:spPr>'
    )
  )
  const imported = OfficeDocument.load(zipSync(parts))
  assert.equal(
    imported.getScene().slides[0]!.objects[0]!.paint?.kind,
    'gradient'
  )
  imported.execute({ type: 'object.update', ref, patch: { x: 40 } })
  assert.equal(
    imported.getScene().slides[0]!.objects[0]!.paint?.kind,
    'gradient'
  )
  imported.execute({ type: 'object.update', ref, patch: { fill: '#00FF00' } })
  assert.equal(imported.getScene().slides[0]!.objects[0]!.paint, undefined)
})
