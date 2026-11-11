import assert from 'node:assert/strict'
import { test } from 'node:test'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { OfficeDocument } from '../src/core/index'
import type { Command } from '../src/types'

const part = 'ppt/slides/slide1.xml'
const frame = { x: 10, y: 20, width: 101, height: 51 }
const ref = { part, id: '9' }
const slideXml = (doc: OfficeDocument) =>
  strFromU8(unzipSync(doc.export())[part]!)
function fixture(merged = false, strict = false, paragraphExtension = false) {
  const parts = unzipSync(OfficeDocument.create().export())
  parts[part] = strToU8(
    strFromU8(parts[part]!).replace(
      '</p:spTree>',
      `
    <p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="9" name="Fixture"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>
    <p:xfrm><a:off x="0" y="0"/><a:ext cx="19050" cy="9525"/></p:xfrm>
    <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
    <a:tbl><a:tblGrid><a:gridCol w="6350"/><a:gridCol w="12700"/></a:tblGrid><a:tr h="9525">
    <a:tc${merged ? ' gridSpan="2"' : ''}><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr b="1"/></a:p></a:txBody><a:tcPr marL="123"/><a:extLst><a:ext uri="custom"><x:opaque xmlns:x="urn:test"/></a:ext></a:extLst></a:tc>
    <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>First</a:t></a:r><a:br/><a:r><a:t>second</a:t></a:r></a:p><a:p>${paragraphExtension ? '<a:pPr algn="ctr"><a:extLst><a:ext uri="paragraph"><x:paragraph xmlns:x="urn:test"/></a:ext></a:extLst></a:pPr>' : ''}<a:r><a:t>third</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>
    </a:tr></a:tbl></a:graphicData></a:graphic></p:graphicFrame><p:extLst/>
    </p:spTree>`
    )
  )
  if (strict) {
    for (const [name, contents] of Object.entries(parts)) {
      if (!/\.(xml|rels)$/.test(name)) continue
      parts[name] = strToU8(
        strFromU8(contents)
          .replaceAll(
            /http:\/\/schemas.openxmlformats.org\/(presentationml|drawingml)\/2006\//g,
            'http://purl.oclc.org/ooxml/$1/'
          )
          .replaceAll(
            'http://schemas.openxmlformats.org/officeDocument/2006/',
            'http://purl.oclc.org/ooxml/officeDocument/'
          )
      )
    }
  }
  return OfficeDocument.load(zipSync(parts))
}

test('imports table column widths and row heights as CSS pixels', () => {
  const object = fixture().getScene().slides[0]!.objects[0]!
  assert.deepEqual(object.columnWidths, [6350 / 9525, 12700 / 9525])
  assert.deepEqual(object.rowHeights, [1])
})

test('updates empty and multiline imported cells while preserving cell XML', () => {
  const doc = fixture()
  const before = slideXml(doc)
  const untouched = before.split('<a:tc>').at(-1)!.split('</a:tc>')[0]!
  assert.deepEqual(doc.getScene().slides[0]!.objects[0]!.cells, [
    ['', 'First\nsecond\nthird'],
  ])
  const unchanged = doc.execute({
    type: 'table.set',
    ref,
    cells: [['', 'First\nsecond\nthird']],
  })
  assert.equal(unchanged.changed, false)
  assert.equal(slideXml(doc), before)
  doc.execute({
    type: 'table.set',
    ref,
    cells: [['alpha\r\n\nbeta', 'First\nsecond\nthird']],
  })
  const updated = slideXml(doc)
  assert.ok(updated.includes(untouched))
  assert.match(updated, /<a:tcPr marL="123"\/>/)
  assert.match(updated, /<x:opaque/)
  assert.match(updated, /<a:rPr b="1"\/>/)
  doc.execute({ type: 'table.set', ref, cells: [['alpha\n\nbeta', '']] })
  const roundtrip = OfficeDocument.load(doc.export())
  assert.deepEqual(roundtrip.getScene().slides[0]!.objects[0]!.cells, [
    ['alpha\n\nbeta', ''],
  ])
  assert.doesNotMatch(slideXml(roundtrip), /<a:br\/>|<a:t>third<\/a:t>/)
})

for (const strict of [false, true]) {
  test(`creates an editable ${strict ? 'Strict' : 'Transitional'} DrawingML table`, () => {
    const doc = fixture(false, strict)
    const cells = [
      ['Name & value', ''],
      ['  two  ', 'first\nsecond'],
    ]
    const result = doc.execute({
      type: 'table.add',
      part,
      frame,
      cells,
      name: 'Results',
    })
    assert.equal(result.ref?.id, '10')
    const roundtrip = OfficeDocument.load(doc.export())
    const object = roundtrip.getScene().slides[0]!.objects[1]!
    assert.equal(object.kind, 'table')
    assert.equal(object.name, 'Results')
    assert.deepEqual(object.cells, cells)
    for (const key of ['x', 'y', 'width', 'height'] as const)
      assert.equal(object[key], frame[key])
    const output = slideXml(doc)
    const uri = strict
      ? 'http://purl.oclc.org/ooxml/drawingml/table'
      : 'http://schemas.openxmlformats.org/drawingml/2006/table'
    assert.ok(
      output.includes(
        `<p:nvGraphicFramePr><p:cNvPr id="10" name="Results"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm>`
      )
    )
    assert.ok(
      output.includes(
        `<a:graphicData uri="${uri}"><a:tbl><a:tblGrid><a:gridCol w="481013"/><a:gridCol w="481012"/></a:tblGrid><a:tr h="242888">`
      )
    )
    assert.match(output, /<\/p:graphicFrame><p:extLst\/>/)
  })
}

test('converts the table URI when importing a slide into a Strict deck', () => {
  const source = OfficeDocument.create()
  source.execute({ type: 'table.add', part, frame, cells: [['Table']] })
  const strict = fixture(false, true)
  const imported = strict.execute({
    type: 'slides.import',
    data: source.export(),
  }).part!
  const output = strFromU8(unzipSync(strict.export())[imported]!)
  assert.match(output, /uri="http:\/\/purl.oclc.org\/ooxml\/drawingml\/table"/)
  assert.deepEqual(strict.getScene().slides.at(-1)!.objects[0]!.cells, [
    ['Table'],
  ])
})

test('rejects malformed and oversized tables and merged cell changes atomically', () => {
  const doc = fixture(true)
  const before = doc.export()
  for (const cells of [
    [],
    [[]],
    [['a'], []],
    [Array(51).fill('')],
    Array.from({ length: 101 }, () => ['']),
  ])
    assert.throws(
      () => doc.execute({ type: 'table.add', part, frame, cells }),
      /table/i
    )
  assert.throws(
    () => doc.execute({ type: 'table.set', ref, cells: [['x', 'y']] }),
    /merged/i
  )
  assert.deepEqual(doc.export(), before)
})

test('resizes table grid and rows proportionally to the edited frame', () => {
  const doc = fixture()
  doc.execute({
    type: 'object.update',
    ref,
    patch: { x: 7, width: 3.0002, height: 2, rotation: 15 },
  })
  const output = slideXml(doc)
  assert.match(
    output,
    /<p:xfrm rot="900000"><a:off x="66675" y="0"\/><a:ext cx="28577" cy="19050"\/>/
  )
  assert.match(
    output,
    /<a:tblGrid><a:gridCol w="9526"\/><a:gridCol w="19051"\/><\/a:tblGrid><a:tr h="19050">/
  )
  const imported = OfficeDocument.load(doc.export()).getScene().slides[0]!
    .objects[0]!
  assert.deepEqual(imported.columnWidths, [9526 / 9525, 19051 / 9525])
  assert.deepEqual(imported.rowHeights, [2])
  const before = doc.export()
  assert.throws(
    () => doc.execute({ type: 'object.update', ref, patch: { width: 0 } }),
    /table frame/
  )
  assert.deepEqual(doc.export(), before)
})

test('keeps opaque paragraph properties exactly once and rejects their removal', () => {
  const doc = fixture(false, false, true)
  doc.execute({
    type: 'table.set',
    ref,
    cells: [['', 'one\ntwo\nthree\nfour']],
  })
  const output = slideXml(doc)
  assert.equal(output.match(/<x:paragraph /g)?.length, 1)
  assert.match(output, /<a:p><a:pPr algn="ctr"\/><a:r><a:t>four<\/a:t>/)
  const before = doc.export()
  assert.throws(
    () => doc.execute({ type: 'table.set', ref, cells: [['', 'one']] }),
    /opaque paragraph/i
  )
  assert.deepEqual(doc.export(), before)
})

test('text.set preserves opaque paragraph data when changing line count', () => {
  const source = OfficeDocument.create()
  const textRef = source.execute({
    type: 'object.add',
    part,
    object: { kind: 'text', frame, text: 'one\ntwo' },
  }).ref!
  const parts = unzipSync(source.export())
  parts[part] = strToU8(
    strFromU8(parts[part]!).replace(
      '<a:p><a:r><a:rPr/><a:t>two',
      '<a:p><a:pPr><a:extLst><a:ext uri="shape-paragraph"><x:shape xmlns:x="urn:test"/></a:ext></a:extLst></a:pPr><a:r><a:rPr/><a:t>two'
    )
  )
  const doc = OfficeDocument.load(zipSync(parts))
  assert.match(slideXml(doc), /<x:shape /)
  doc.execute({ type: 'text.set', ref: textRef, text: 'one\ntwo\nthree' })
  assert.equal(slideXml(doc).match(/<x:shape /g)?.length, 1)
  const before = doc.export()
  assert.throws(
    () => doc.execute({ type: 'text.set', ref: textRef, text: 'one' }),
    /opaque paragraph/i
  )
  assert.deepEqual(doc.export(), before)
})

function modifyFixture(doc: OfficeDocument, edit: (source: string) => string) {
  const parts = unzipSync(doc.export())
  parts[part] = strToU8(edit(strFromU8(parts[part]!)))
  return OfficeDocument.load(zipSync(parts))
}

function structure(
  doc: OfficeDocument,
  axis: 'row' | 'column',
  action: 'insert' | 'delete',
  index: number
) {
  return doc.execute({ type: 'table.structure', ref, axis, action, index })
}

for (const strict of [false, true]) {
  test(`inserts and deletes ${strict ? 'Strict' : 'Transitional'} table rows and columns`, () => {
    const doc = modifyFixture(fixture(false, strict), (source) =>
      source
        .replace('<a:tr h="9525">', '<a:tr h="6350">')
        .replace(
          '</a:tr></a:tbl>',
          '<a:extLst><a:ext uri="row"><x:row xmlns:x="urn:test"/></a:ext></a:extLst></a:tr><a:tr h="3175"><a:tc/><a:tc/></a:tr></a:tbl>'
        )
    )
    assert.deepEqual(structure(doc, 'row', 'insert', 0), { changed: true, ref })
    let object = OfficeDocument.load(doc.export()).getScene().slides[0]!
      .objects[0]!
    assert.deepEqual(object.cells, [
      ['', ''],
      ['', 'First\nsecond\nthird'],
      ['', ''],
    ])
    assert.deepEqual(
      object.rowHeights,
      [3810, 3810, 1905].map((h) => h / 9525)
    )
    assert.deepEqual(object.columnWidths, [6350 / 9525, 12700 / 9525])

    structure(doc, 'row', 'delete', 2)
    structure(doc, 'column', 'insert', 2)
    object = OfficeDocument.load(doc.export()).getScene().slides[0]!.objects[0]!
    assert.deepEqual(object.cells, [
      ['', '', ''],
      ['', 'First\nsecond\nthird', ''],
    ])
    assert.deepEqual(
      object.columnWidths,
      [3810, 7620, 7620].map((w) => w / 9525)
    )
    assert.deepEqual(object.rowHeights, [4763 / 9525, 4762 / 9525])
    const updated = slideXml(doc)
    assert.match(
      updated,
      /<p:xfrm><a:off x="0" y="0"\/><a:ext cx="19050" cy="9525"\/><\/p:xfrm>/
    )
    assert.match(
      updated,
      /<\/a:tc>\s*<a:extLst><a:ext uri="row"><x:row[^>]*\/><\/a:ext><\/a:extLst><\/a:tr>/
    )
    assert.match(
      updated,
      /<a:tcPr marL="123"\/><a:extLst><a:ext uri="custom"><x:opaque/
    )
    assert.equal(updated.match(/<x:row /g)?.length, 1)
    assert.equal(updated.match(/<x:opaque /g)?.length, 1)

    structure(doc, 'column', 'delete', 0)
    structure(doc, 'row', 'delete', 0)
    object = OfficeDocument.load(doc.export()).getScene().slides[0]!.objects[0]!
    assert.deepEqual(object.cells, [['First\nsecond\nthird', '']])
    assert.deepEqual(object.columnWidths, [1, 1])
    assert.deepEqual(object.rowHeights, [1])
    assert.doesNotMatch(slideXml(doc), /<x:opaque /)

    structure(doc, 'row', 'insert', 1)
    structure(doc, 'column', 'insert', 0)
    object = OfficeDocument.load(doc.export()).getScene().slides[0]!.objects[0]!
    assert.deepEqual(object.cells, [
      ['', 'First\nsecond\nthird', ''],
      ['', '', ''],
    ])
    assert.deepEqual(
      object.columnWidths,
      [6350, 6350, 6350].map((w) => w / 9525)
    )
    assert.deepEqual(object.rowHeights, [4763 / 9525, 4762 / 9525])
    structure(doc, 'column', 'delete', 2)
    assert.deepEqual(doc.getScene().slides[0]!.objects[0]!.cells, [
      ['', 'First\nsecond\nthird'],
      ['', ''],
    ])
  })
}

test('rejects invalid structure parameters and deleting the final row or column', () => {
  const doc = fixture()
  const before = doc.export()
  for (const patch of [
    { axis: 'diagonal' },
    { action: 'move' },
    { index: '0' },
    { index: 0.5 },
    { index: -1 },
    { index: 3 },
    { action: 'delete', index: 2 },
    { axis: 'row', action: 'delete' },
  ])
    assert.throws(
      () =>
        doc.execute({
          type: 'table.structure',
          ref,
          axis: 'column',
          action: 'insert',
          index: 0,
          ...patch,
        } as Command),
      /table/i
    )
  assert.deepEqual(doc.export(), before)
  structure(doc, 'column', 'delete', 1)
  const singleColumn = doc.export()
  assert.throws(() => structure(doc, 'column', 'delete', 0), /table/i)
  assert.deepEqual(doc.export(), singleColumn)
})

test('rejects merged tables and malformed table grids atomically', () => {
  const source = fixture()
  for (const [before, after, error] of [
    ['<a:tc>', '<a:tc gridSpan="2">', /merged/i],
    ['<a:tc>', '<a:tc rowSpan="2">', /merged/i],
    ['<a:tc>', '<a:tc hMerge="true">', /merged/i],
    ['<a:tc>', '<a:tc vMerge="1">', /merged/i],
    ['<a:gridCol w="6350"/>', '', /grid/i],
    ['w="6350"', 'w="6350.5"', /extent/i],
    ['h="9525"', 'h="0"', /extent/i],
    ['cy="9525"', 'cy="1"', /extent/i],
  ] as const) {
    const doc = modifyFixture(source, (xml) => xml.replace(before, after))
    const contents = doc.export()
    assert.throws(() => structure(doc, 'row', 'insert', 1), error)
    assert.deepEqual(doc.export(), contents)
  }
})

test('enforces the row and column insertion limits', () => {
  for (const [axis, rowCount, columnCount] of [
    ['row', 100, 1],
    ['column', 1, 50],
  ] as const) {
    const doc = OfficeDocument.create()
    const table = doc.execute({
      type: 'table.add',
      part,
      frame,
      cells: Array.from({ length: rowCount }, () =>
        Array(columnCount).fill('')
      ),
    })
    const before = doc.export()
    assert.throws(
      () =>
        doc.execute({
          type: 'table.structure',
          ref: table.ref!,
          axis,
          action: 'insert',
          index: 0,
        }),
      /table/i
    )
    assert.deepEqual(doc.export(), before)
  }
})
