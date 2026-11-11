import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate'
import { OfficeDocument } from '../src/core/index.js'
const part = 'ppt/slides/slide1.xml'
test('nested group fill resolves nearest explicit ancestor and a child edit overrides it', () => {
  const doc = OfficeDocument.create()
  const ref = doc.execute({
    type: 'object.add',
    part,
    object: { kind: 'shape', frame: { x: 10, y: 10, width: 100, height: 100 } },
  }).ref!
  const parts = unzipSync(doc.export())
  let xml = strFromU8(parts[part]!).replace(
    '</p:spPr>',
    '<a:grpFill/></p:spPr>'
  )
  const shape = xml.match(/<p:sp>.*?<\/p:sp>/)![0]!
  const xf =
    '<a:xfrm><a:off x="0" y="0"/><a:ext cx="952500" cy="952500"/><a:chOff x="0" y="0"/><a:chExt cx="952500" cy="952500"/></a:xfrm>'
  const group = (id: string, fill: string, contents: string) =>
    `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${id}" name="Group"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr>${xf}${fill}</p:grpSpPr>${contents}</p:grpSp>`
  xml = xml.replace(
    shape,
    group(
      '40',
      '<a:solidFill><a:srgbClr val="FF8040"><a:shade val="50000"/></a:srgbClr></a:solidFill>',
      group('41', '<a:grpFill/>', shape)
    )
  )
  parts[part] = strToU8(xml)
  const imported = OfficeDocument.load(zipSync(parts))
  assert.equal(imported.getScene().slides[0]!.objects[0]!.fill, '#804020')
  imported.execute({ type: 'object.update', ref, patch: { fill: '#224466' } })
  assert.equal(
    OfficeDocument.load(imported.export()).getScene().slides[0]!.objects[0]!
      .fill,
    '#224466'
  )
  assert.match(strFromU8(unzipSync(imported.export())[part]!), /val="FF8040"/)
})
