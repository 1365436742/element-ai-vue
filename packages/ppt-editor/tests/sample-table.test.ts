import { test } from 'node:test'
import assert from 'node:assert/strict'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { OfficeDocument } from '../src/core/index.js'
const part = 'ppt/slides/slide1.xml'
function mergedTable() {
  const doc = OfficeDocument.create()
  const ref = doc.execute({
    type: 'table.add',
    part,
    frame: { x: 10, y: 10, width: 300, height: 200 },
    cells: [
      ['Anchor', '', 'C'],
      ['', '', 'F'],
    ],
  }).ref!
  const parts = unzipSync(doc.export())
  let index = 0
  parts[part] = strToU8(
    strFromU8(parts[part]!).replace(
      /<a:tc>/g,
      () =>
        [
          '<a:tc gridSpan="2" rowSpan="2">',
          '<a:tc hMerge="1" rowSpan="2">',
          '<a:tc>',
          '<a:tc vMerge="1" gridSpan="2">',
          '<a:tc hMerge="1" vMerge="1">',
          '<a:tc>',
        ][index++]!
    )
  )
  return { doc: OfficeDocument.load(zipSync(parts)), ref }
}
test('merged table scene exposes anchors and editable content without losing merge XML', () => {
  const { doc, ref } = mergedTable()
  const table = doc.getScene().slides[0]!.objects[0]!
  assert.equal(table.tableCells?.[0]?.[0]?.rowSpan, 2)
  assert.equal(table.tableCells?.[0]?.[0]?.columnSpan, 2)
  assert.deepEqual(table.tableCells?.[1]?.[1]?.mergedInto, {
    row: 0,
    column: 0,
  })
  doc.execute({
    type: 'table.set',
    ref,
    cells: [
      ['Edited\nanchor', '', 'C'],
      ['', '', 'F'],
    ],
  })
  const output = strFromU8(unzipSync(doc.export())[part]!)
  assert.match(output, /gridSpan="2" rowSpan="2"/)
  assert.match(output, /hMerge="1" vMerge="1"/)
  assert.equal(
    OfficeDocument.load(doc.export()).getScene().slides[0]!.objects[0]!
      .cells?.[0]?.[0],
    'Edited\nanchor'
  )
  const before = doc.export()
  assert.throws(
    () =>
      doc.execute({
        type: 'table.set',
        ref,
        cells: [
          ['Edited\nanchor', 'Hidden', 'C'],
          ['', '', 'F'],
        ],
      }),
    /merged/i
  )
  assert.deepEqual(doc.export(), before)
})
test('explicit merged cell fill, alignment, margins and text style appear in scene', () => {
  const { doc } = mergedTable()
  const parts = unzipSync(doc.export())
  parts[part] = strToU8(
    strFromU8(parts[part]!)
      .replace(
        '<a:tcPr/>',
        '<a:tcPr anchor="ctr" marL="95250"><a:solidFill><a:srgbClr val="ED7D31"/></a:solidFill></a:tcPr>'
      )
      .replace(
        '<a:p><a:r>',
        '<a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="2400" b="1"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr>'
      )
  )
  const cell = OfficeDocument.load(zipSync(parts)).getScene().slides[0]!
    .objects[0]!.tableCells?.[0]?.[0]
  assert.equal(cell?.fill, '#ED7D31')
  assert.equal(cell?.verticalAlign, 'center')
  assert.equal(cell?.margins.left, 10)
  assert.equal(cell?.style.fontSize, 32)
  assert.equal(cell?.style.align, 'center')
  assert.equal(cell?.style.bold, true)
  assert.equal(cell?.style.color, '#FFFFFF')
})
