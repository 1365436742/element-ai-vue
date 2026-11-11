import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate'
import { DOMParser } from '@xmldom/xmldom'
import { OfficeDocument } from '../src/core/index.js'
const part = 'ppt/slides/slide1.xml'
function fixture(shape: string) {
  const f = unzipSync(OfficeDocument.create().export())
  f[part] = strToU8(
    strFromU8(f[part]!).replace('</p:spTree>', shape + '</p:spTree>')
  )
  return f
}
const shape =
  '<p:sp><p:nvSpPr><p:cNvPr id="9" name="sample"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="95250" y="0"/><a:ext cx="952500" cy="476250"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:ln/><a:effectLst/><a:extLst/></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>First</a:t></a:r></a:p><a:p><a:r><a:rPr i="1"/><a:t>Second</a:t></a:r></a:p></p:txBody></p:sp>'
function xml(d: OfficeDocument, p = part) {
  return new DOMParser().parseFromString(
    strFromU8(unzipSync(d.export())[p]!),
    'application/xml'
  )
}
test('edited fill remains before line and effects in exported shape properties', () => {
  const d = OfficeDocument.load(zipSync(fixture(shape)))
  d.execute({
    type: 'object.update',
    ref: { part, id: '9' },
    patch: { fill: '#ff0000' },
  })
  const node = xml(d).getElementsByTagName('p:spPr')[0]!
  const names = Array.from(node.childNodes)
    .filter((n) => n.nodeType === 1)
    .map((n) => n.nodeName)
  assert.deepEqual(names, [
    'a:xfrm',
    'a:prstGeom',
    'a:solidFill',
    'a:ln',
    'a:effectLst',
    'a:extLst',
  ])
})
test('text replacement reconciles independent paragraphs and inherited runs gain requested formatting', () => {
  const d = OfficeDocument.load(zipSync(fixture(shape)))
  d.execute({
    type: 'text.set',
    ref: { part, id: '9' },
    text: 'New\nSecond',
    style: { bold: true },
  })
  const parsed = xml(d),
    ps = Array.from(parsed.getElementsByTagName('a:p'))
  assert.equal(ps.length, 2)
  assert.equal(ps[0]!.textContent, 'New')
  assert.equal(ps[1]!.textContent, 'Second')
  assert.equal(ps[0]!.getElementsByTagName('a:rPr')[0]!.getAttribute('b'), '1')
  assert.equal(ps[1]!.getElementsByTagName('a:rPr')[0]!.getAttribute('i'), '1')
  d.execute({ type: 'text.set', ref: { part, id: '9' }, text: 'One' })
  assert.equal(xml(d).getElementsByTagName('a:p').length, 1)
})
test('grouped object drag in scene space writes the inverse local transform', () => {
  const group =
    '<p:grpSp><p:nvGrpSpPr><p:cNvPr id="20" name="Group"/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="952500" y="0"/><a:ext cx="3810000" cy="1905000"/><a:chOff x="0" y="0"/><a:chExt cx="1905000" cy="952500"/></a:xfrm></p:grpSpPr>' +
    shape +
    '</p:grpSp>'
  const d = OfficeDocument.load(zipSync(fixture(group)))
  assert.equal(d.getScene().slides[0]!.objects[0]!.x, 120)
  d.execute({
    type: 'object.update',
    ref: { part, id: '9' },
    patch: { x: 130, width: 220 },
  })
  const o = d.getScene().slides[0]!.objects[0]!
  assert.equal(o.x, 130)
  assert.equal(o.width, 220)
})
test('master and layout IDs stay unique after deleting a middle registration', () => {
  const d = OfficeDocument.create()
  const a = d.execute({ type: 'master.add' }).part!
  d.execute({ type: 'master.add' })
  d.execute({ type: 'master.delete', part: a })
  d.execute({ type: 'master.add' })
  const ids = Array.from(
    xml(d, 'ppt/presentation.xml').getElementsByTagName('p:sldMasterId')
  ).map((n) => n.getAttribute('id'))
  assert.equal(new Set(ids).size, 3)
  const m = d.getScene().masters[0]!.part,
    l = d.execute({ type: 'layout.add', masterPart: m }).part!
  d.execute({ type: 'layout.add', masterPart: m })
  d.execute({ type: 'layout.delete', part: l })
  d.execute({ type: 'layout.add', masterPart: m })
  const ls = Array.from(xml(d, m).getElementsByTagName('p:sldLayoutId')).map(
    (n) => n.getAttribute('id')
  )
  assert.equal(new Set(ls).size, 3)
})
test('presentation root relationship can point outside the conventional ppt directory', () => {
  const f = unzipSync(OfficeDocument.create().export())
  f['document/main.xml'] = f['ppt/presentation.xml']!
  delete f['ppt/presentation.xml']
  f['document/_rels/main.xml.rels'] = strToU8(
    strFromU8(f['ppt/_rels/presentation.xml.rels']!).replace(
      /Target="/g,
      'Target="../ppt/'
    )
  )
  delete f['ppt/_rels/presentation.xml.rels']
  f['_rels/.rels'] = strToU8(
    strFromU8(f['_rels/.rels']!).replace(
      'ppt/presentation.xml',
      'document/main.xml'
    )
  )
  f['[Content_Types].xml'] = strToU8(
    strFromU8(f['[Content_Types].xml']!).replace(
      '/ppt/presentation.xml',
      '/document/main.xml'
    )
  )
  const d = OfficeDocument.load(zipSync(f))
  assert.equal(d.getScene().slides.length, 1)
  d.execute({ type: 'slide.add' })
  assert.equal(OfficeDocument.load(d.export()).getScene().slides.length, 2)
})
test('placeholder inherits omitted type, background and theme color without duplicating layout text', () => {
  const f = unzipSync(OfficeDocument.create().export()),
    layout = 'ppt/slideLayouts/slideLayout1.xml'
  const tpl = shape
    .replace('<p:nvPr/>', '<p:nvPr><p:ph type="title" idx="1"/></p:nvPr>')
    .replace(
      '<a:t>First</a:t>',
      '<a:rPr sz="4400"><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:rPr><a:t>First</a:t>'
    )
  f[layout] = strToU8(
    strFromU8(f[layout]!)
      .replace(
        '<p:spTree>',
        '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="112233"/></a:solidFill></p:bgPr></p:bg><p:spTree>'
      )
      .replace('</p:spTree>', tpl + '</p:spTree>')
  )
  f[part] = strToU8(
    strFromU8(f[part]!).replace(
      '</p:spTree>',
      '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:p><a:r><a:t>Actual</a:t></a:r></a:p></p:txBody></p:sp></p:spTree>'
    )
  )
  const d = OfficeDocument.load(zipSync(f)),
    page = d.getScene().slides[0]!
  assert.equal(page.background, '#112233')
  assert.equal(page.objects.length, 1)
  assert.equal(page.objects[0]!.x, 10)
  assert.equal(page.objects[0]!.style?.fontSize, 4400 / 75)
  assert.equal(page.objects[0]!.style?.color, '#4472C4')
  d.execute({
    type: 'object.update',
    ref: { part, id: '2' },
    patch: { style: { bold: true } },
  })
  assert.equal(d.getScene().slides[0]!.objects[0]!.width, 100)
})
test('master replacement registers migrated layouts on both sides', () => {
  const d = OfficeDocument.create(),
    scene = d.getScene(),
    replacement = d.execute({ type: 'master.add' }).part!
  d.execute({ type: 'layout.add', masterPart: replacement })
  d.execute({
    type: 'master.delete',
    part: scene.masters[0]!.part,
    replacementPart: replacement,
  })
  const next = d.getScene()
  assert.equal(next.layouts.length, 2)
  assert.ok(next.layouts.every((l) => l.masterPart === replacement))
  assert.equal(
    xml(d, replacement).getElementsByTagName('p:sldLayoutId').length,
    2
  )
})
test('cross-document import closes dependencies and converts Transitional XML to a Strict target', () => {
  const source = OfficeDocument.create('Source')
  source.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'text',
      text: 'Imported slide',
      frame: { x: 10, y: 20, width: 200, height: 50 },
    },
  })
  const f = unzipSync(OfficeDocument.create('Target').export())
  for (const key of Object.keys(f))
    if (key.endsWith('.xml') || key.endsWith('.rels'))
      f[key] = strToU8(
        strFromU8(f[key]!)
          .replaceAll(
            'http://schemas.openxmlformats.org/presentationml/2006/main',
            'http://purl.oclc.org/ooxml/presentationml/main'
          )
          .replaceAll(
            'http://schemas.openxmlformats.org/drawingml/2006/main',
            'http://purl.oclc.org/ooxml/drawingml/main'
          )
          .replaceAll(
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            'http://purl.oclc.org/ooxml/officeDocument/relationships'
          )
      )
  const target = OfficeDocument.load(zipSync(f))
  target.execute({ type: 'slides.import', data: source.export() })
  const scene = OfficeDocument.load(target.export()).getScene()
  assert.equal(scene.slides.length, 2)
  assert.equal(scene.slides[1]!.objects[0]!.text, 'Imported slide')
  assert.equal(scene.masters.length, 2)
  const out = unzipSync(target.export())
  for (const key of Object.keys(out).filter(
    (k) => k.includes('copy') && (k.endsWith('.xml') || k.endsWith('.rels'))
  ))
    assert.doesNotMatch(
      strFromU8(out[key]!),
      /schemas.openxmlformats.org\/(presentationml|drawingml|officeDocument)\//
    )
})
test('duplicating a master also copies and registers its layouts', () => {
  const d = OfficeDocument.create(),
    original = d.getScene().masters[0]!.part
  const result = d.execute({
    type: 'master.duplicate',
    part: original,
    name: 'Copied master',
  })
  const scene = d.getScene()
  assert.equal(scene.masters.length, 2)
  assert.equal(scene.layouts.length, 2)
  assert.ok(scene.layouts.some((l) => l.masterPart === result.part))
  assert.equal(
    scene.masters.find((m) => m.part === result.part)?.name,
    'Copied master'
  )
})
