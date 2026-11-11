import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OfficeDocument } from '../src/core/index.js'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
const part = 'ppt/slides/slide1.xml'
test('preset and custom geometry reach the scene; connectors remain editable standard objects', () => {
  const doc = OfficeDocument.create()
  const ref = doc.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'shape',
      geometry: 'rightArrow',
      frame: { x: 0, y: 0, width: 200, height: 100 },
      fill: '#4472C4',
    },
  }).ref!
  assert.ok(doc.getScene().slides[0]!.objects[0]!.paths?.[0]?.d.includes('L'))
  const parts = unzipSync(doc.export())
  parts[part] = strToU8(
    strFromU8(parts[part]!).replace(
      '</p:spTree>',
      '<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="42" name="Connector"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr><a:xfrm flipV="1"><a:off x="95250" y="95250"/><a:ext cx="1905000" cy="952500"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="19050"><a:solidFill><a:srgbClr val="112233"/></a:solidFill><a:prstDash val="dash"/><a:tailEnd type="triangle"/></a:ln></p:spPr></p:cxnSp></p:spTree>'
    )
  )
  const imported = OfficeDocument.load(zipSync(parts))
  const line = imported.getScene().slides[0]!.objects[1]!
  assert.equal(line.kind, 'shape')
  assert.equal(line.geometry, 'line')
  assert.ok(line.paths?.length)
  assert.equal(line.flipV, true)
  assert.equal(line.tailEnd, 'triangle')
  assert.equal(line.strokeDash, 'dash')
  imported.execute({
    type: 'object.update',
    ref: line,
    patch: { x: 30, width: 400, stroke: '#FF0000' },
  })
  const output = OfficeDocument.load(imported.export()).getScene().slides[0]!
    .objects[1]!
  assert.equal(output.x, 30)
  assert.equal(output.stroke, '#FF0000')
  assert.equal(output.width, 400)
  assert.equal(imported.getScene().slides[0]!.objects[0]!.id, ref.id)
})

test('scene keeps per-run formatting and body alignment from standard text', () => {
  const doc = OfficeDocument.create()
  doc.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'text',
      text: 'One',
      frame: { x: 0, y: 0, width: 200, height: 100 },
    },
  })
  const parts = unzipSync(doc.export())
  parts[part] = strToU8(
    strFromU8(parts[part]!)
      .replace('<a:bodyPr/>', '<a:bodyPr anchor="ctr"/>')
      .replace(
        '<a:t>One</a:t></a:r>',
        '<a:t>One</a:t></a:r><a:r><a:rPr b="1" sz="3200"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></a:rPr><a:t>Two</a:t></a:r>'
      )
  )
  const shape = OfficeDocument.load(zipSync(parts)).getScene().slides[0]!
    .objects[0]!
  assert.equal(shape.richText?.anchor, 'ctr')
  assert.equal(shape.richText?.paragraphs[0]?.runs[1]?.style.bold, true)
  assert.equal(shape.richText?.paragraphs[0]?.runs[1]?.style.color, '#FF0000')
  assert.equal(
    shape.richText?.paragraphs[0]?.runs[1]?.style.fontSize,
    3200 / 75
  )
})
