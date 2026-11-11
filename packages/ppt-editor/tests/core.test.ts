import { DOMParser } from '@xmldom/xmldom'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'
import { OfficeDocument } from '../src/core/index'
test('new package round trips shapes, text, images and slide ordering', () => {
  const doc = OfficeDocument.create('Demo')
  const p = doc.getScene().slides[0]!.part
  const ref = doc.execute({
    type: 'object.add',
    part: p,
    object: {
      kind: 'text',
      text: 'Hello',
      frame: { x: 20, y: 30, width: 200, height: 80 },
      style: { bold: true, fontSize: 24 },
    },
  }).ref!
  doc.execute({ type: 'text.set', ref, text: 'Changed' })
  doc.execute({
    type: 'object.add',
    part: p,
    object: {
      kind: 'image',
      frame: { x: 1, y: 2, width: 3, height: 4 },
      data: new Uint8Array([1, 2]),
      mimeType: 'image/png',
    },
  })
  const copy = doc.execute({ type: 'slide.duplicate', part: p }).part!
  doc.execute({ type: 'slide.move', part: copy, index: 0 })
  const scene = OfficeDocument.load(doc.export()).getScene()
  assert.equal(scene.title, 'Demo')
  assert.equal(scene.slides.length, 2)
  assert.equal(scene.slides[0]!.part, copy)
  assert.equal(scene.slides[0]!.objects[0]!.text, 'Changed')
  assert.equal(scene.slides[0]!.objects[0]!.style!.bold, true)
  assert.match(
    scene.slides[0]!.objects[1]!.src!,
    /^data:image\/png;base64,AQI=/
  )
  assert.equal(scene.masters.length, 1)
  assert.equal(scene.layouts.length, 1)
})
test('invalid transactions leave every package byte intact', () => {
  const d = OfficeDocument.create()
  const before = d.export()
  assert.throws(() =>
    d.execute({
      type: 'object.update',
      ref: { part: 'ppt/slides/slide1.xml', id: 'missing' },
      patch: { x: 42 },
    })
  )
  assert.deepEqual(d.export(), before)
  assert.throws(() => OfficeDocument.load(new Uint8Array([1, 2])))
})
test('source XML and unknown parts survive an unrelated edit', () => {
  const d = OfficeDocument.create()
  const entries = unzipSync(d.export())
  entries['custom/opaque.bin'] = new Uint8Array([9, 8, 7])
  const p = 'ppt/slides/slide1.xml'
  entries[p] = strToU8(
    strFromU8(entries[p]!).replace(
      '</p:spTree>',
      '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="99" name="Mystery"/></p:nvGraphicFramePr><x:opaque xmlns:x="urn:test"/></p:graphicFrame></p:spTree>'
    )
  )
  const loaded = OfficeDocument.load(zipSync(entries))
  assert.equal(loaded.getScene().slides[0]!.objects[0]!.kind, 'unsupported')
  loaded.execute({ type: 'page.rename', part: p, name: 'Renamed' })
  const out = unzipSync(loaded.export())
  assert.deepEqual(out['custom/opaque.bin'], new Uint8Array([9, 8, 7]))
  assert.match(strFromU8(out[p]!), /x:opaque/)
})
test('unsafe relationship traversal is rejected', () => {
  const entries = unzipSync(OfficeDocument.create().export())
  entries['ppt/_rels/presentation.xml.rels'] = strToU8(
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r" Type="x" Target="../../../../outside.xml"/></Relationships>'
  )
  assert.throws(() => OfficeDocument.load(zipSync(entries)), /path|target/i)
})
test('independent XML fixture uses slide relationship ordering and inherited master objects', () => {
  const files: Record<string, Uint8Array> = {}
  const p = 'http://schemas.openxmlformats.org/presentationml/2006/main',
    a = 'http://schemas.openxmlformats.org/drawingml/2006/main',
    r = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
  const put = (key: string, value: string) => (files[key] = strToU8(value))
  const shape =
    '<p:sp><p:nvSpPr><p:cNvPr id="7" name="Brand"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="95250" y="190500"/><a:ext cx="952500" cy="476250"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:rPr b="1"/><a:t>Brand label</a:t></a:r></a:p></p:txBody></p:sp>'
  put('[Content_Types].xml', '<Types/>')
  put(
    '_rels/.rels',
    `<Relationships><Relationship Id="root" Type="${r}/officeDocument" Target="ppt/presentation.xml"/></Relationships>`
  )
  put(
    'ppt/presentation.xml',
    `<p:presentation xmlns:p="${p}" xmlns:r="${r}"><p:sldIdLst><p:sldId id="257" r:id="second"/><p:sldId id="256" r:id="first"/></p:sldIdLst><p:sldSz cx="9144000" cy="6858000"/></p:presentation>`
  )
  put(
    'ppt/_rels/presentation.xml.rels',
    `<Relationships><Relationship Id="first" Type="${r}/slide" Target="slides/a.xml"/><Relationship Id="second" Type="${r}/slide" Target="slides/b.xml"/></Relationships>`
  )
  for (const s of ['a', 'b']) {
    put(
      `ppt/slides/${s}.xml`,
      `<p:sld xmlns:p="${p}" xmlns:a="${a}"><p:cSld name="${s}"><p:spTree/></p:cSld></p:sld>`
    )
    put(
      `ppt/slides/_rels/${s}.xml.rels`,
      `<Relationships><Relationship Id="layout" Type="${r}/slideLayout" Target="../slideLayouts/layout.xml"/></Relationships>`
    )
  }
  put(
    'ppt/slideLayouts/layout.xml',
    `<p:sldLayout xmlns:p="${p}"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`
  )
  put(
    'ppt/slideLayouts/_rels/layout.xml.rels',
    `<Relationships><Relationship Id="master" Type="${r}/slideMaster" Target="../slideMasters/master.xml"/></Relationships>`
  )
  put(
    'ppt/slideMasters/master.xml',
    `<p:sldMaster xmlns:p="${p}" xmlns:a="${a}"><p:cSld><p:spTree>${shape}</p:spTree></p:cSld></p:sldMaster>`
  )
  const d = OfficeDocument.load(zipSync(files))
  const scene = d.getScene()
  assert.deepEqual(
    scene.slides.map((x) => x.name),
    ['b', 'a']
  )
  assert.equal(scene.width, 960)
  assert.equal(scene.slides[0]!.objects[0]!.inherited, true)
  assert.equal(scene.slides[0]!.objects[0]!.x, 10)
  assert.equal(scene.slides[0]!.objects[0]!.text, 'Brand label')
})
test('deleting a layout redirects its slide references and removes its master registration', () => {
  const d = OfficeDocument.create()
  const s = d.getScene()
  const old = s.layouts[0]!.part
  const next = d.execute({
    type: 'layout.add',
    masterPart: s.masters[0]!.part,
  }).part!
  assert.throws(() => d.execute({ type: 'layout.delete', part: old }))
  d.execute({ type: 'layout.delete', part: old, replacementPart: next })
  assert.equal(d.getScene().layouts.length, 1)
  assert.equal(d.getScene().slides[0]!.layoutPart, next)
  assert.equal(OfficeDocument.load(d.export()).getScene().layouts.length, 1)
})
test('text replacement handles paragraph count without retaining stale newlines or losing run properties', () => {
  const d = OfficeDocument.create()
  const part = d.getScene().slides[0]!.part
  const ref = d.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'text',
      text: 'First\nSecond',
      frame: { x: 0, y: 0, width: 200, height: 100 },
      style: { bold: true, color: '#AA0011' },
    },
  }).ref!
  assert.equal(d.getScene().slides[0]!.objects[0]!.text, 'First\nSecond')
  d.execute({ type: 'text.set', ref, text: 'Only' })
  assert.equal(d.getScene().slides[0]!.objects[0]!.text, 'Only')
  assert.equal(d.getScene().slides[0]!.objects[0]!.style!.bold, true)
  assert.equal(d.getScene().slides[0]!.objects[0]!.style!.color, '#AA0011')
})
test('encoded relationship traversal is rejected', () => {
  const f = unzipSync(OfficeDocument.create().export())
  f['ppt/_rels/presentation.xml.rels'] = strToU8(
    '<Relationships><Relationship Id="bad" Type="x" Target="%2e%2e/%2e%2e/secret"/></Relationships>'
  )
  assert.throws(() => OfficeDocument.load(zipSync(f)), /path|target/i)
})
test('default master has its mandatory color map and theme style lists have three entries', () => {
  const parts = unzipSync(OfficeDocument.create().export())
  const master = strFromU8(parts['ppt/slideMasters/slideMaster1.xml']!)
  assert.match(master, /<p:clrMap\s/)
  const theme = strFromU8(parts['ppt/theme/theme1.xml']!)
  const styles = theme.match(/<a:fillStyleLst>(.*?)<\/a:fillStyleLst>/)![1]!
  assert.equal((styles.match(/<a:solidFill>/g) || []).length, 3)
})
test('placeholder frame inherits from layout when the slide omits its transform', () => {
  const f = unzipSync(OfficeDocument.create().export())
  const layout = 'ppt/slideLayouts/slideLayout1.xml',
    slide = 'ppt/slides/slide1.xml'
  const shape =
    '<p:sp><p:nvSpPr><p:cNvPr id="9" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr>TRANSFORM</p:spPr><p:txBody><a:bodyPr/><a:p><a:r><a:rPr/><a:t>TEXT</a:t></a:r></a:p></p:txBody></p:sp>'
  f[layout] = strToU8(
    strFromU8(f[layout]!).replace(
      '</p:spTree>',
      shape
        .replace(
          'TRANSFORM',
          '<a:xfrm><a:off x="95250" y="190500"/><a:ext cx="952500" cy="476250"/></a:xfrm>'
        )
        .replace('TEXT', 'Layout title') + '</p:spTree>'
    )
  )
  f[slide] = strToU8(
    strFromU8(f[slide]!).replace(
      '</p:spTree>',
      shape.replace('TRANSFORM', '').replace('TEXT', 'Slide title') +
        '</p:spTree>'
    )
  )
  const o = OfficeDocument.load(zipSync(f)).getScene().slides[0]!.objects[0]!
  assert.equal(o.text, 'Slide title')
  assert.equal(o.x, 10)
  assert.equal(o.width, 100)
  assert.equal(o.inherited, undefined)
})
test('Strict edits keep new parts in the original namespace variant', () => {
  const f = unzipSync(OfficeDocument.create().export())
  for (const p of Object.keys(f))
    if (p.endsWith('.xml') || p.endsWith('.rels'))
      f[p] = strToU8(
        strFromU8(f[p]!)
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
  const d = OfficeDocument.load(zipSync(f))
  assert.equal(d.getScene().variant, 'strict')
  d.execute({ type: 'slide.add' })
  const out = unzipSync(d.export())
  assert.doesNotMatch(
    strFromU8(out['ppt/slides/slide2.xml']!),
    /schemas.openxmlformats.org\/presentationml/
  )
  assert.match(strFromU8(out['ppt/slides/slide2.xml']!), /purl.oclc.org/)
  assert.equal(OfficeDocument.load(d.export()).getScene().variant, 'strict')
})
test('malformed source XML cannot be silently repaired on import', () => {
  const f = unzipSync(OfficeDocument.create().export())
  f['ppt/slides/slide1.xml'] = strToU8('<p:sld xmlns:p="urn:test"><p:cSld>')
  assert.throws(() => OfficeDocument.load(zipSync(f)))
})
test('deleted slide removes its relationship part and content type override', () => {
  const d = OfficeDocument.create()
  d.execute({ type: 'slide.add' })
  d.execute({ type: 'slide.delete', part: 'ppt/slides/slide1.xml' })
  const f = unzipSync(d.export())
  assert.equal(f['ppt/slides/_rels/slide1.xml.rels'], undefined)
  assert.doesNotMatch(
    strFromU8(f['[Content_Types].xml']!),
    /PartName="\/ppt\/slides\/slide1.xml"/
  )
  assert.equal(OfficeDocument.load(d.export()).getScene().slides.length, 1)
})

// Fix round 2 fixtures intentionally author run/paragraph XML rather than using editor text commands.
const fix2Part = 'ppt/slides/slide1.xml'
const fix2Shape = (body: string, fill = '') =>
  `<p:sp><p:nvSpPr><p:cNvPr id="90" name="Independent"/><p:cNvSpPr/><p:nvPr><p:ph idx="7"/></p:nvPr></p:nvSpPr><p:spPr>${fill}</p:spPr><p:txBody><a:bodyPr/><a:lstStyle/>${body}</p:txBody></p:sp>`
function fix2Document(body: string, fill = '') {
  const f = unzipSync(OfficeDocument.create().export())
  f[fix2Part] = strToU8(
    strFromU8(f[fix2Part]!).replace(
      '</p:spTree>',
      fix2Shape(body, fill) + '</p:spTree>'
    )
  )
  return OfficeDocument.load(zipSync(f))
}
function fix2Xml(d: OfficeDocument, part = fix2Part) {
  return new DOMParser().parseFromString(
    strFromU8(unzipSync(d.export())[part]!),
    'application/xml'
  )
}
function fix2Kids(n: any) {
  return Array.from(n.childNodes)
    .filter((v: any) => v.nodeType === 1)
    .map((v: any) => v.localName)
}
test('empty paragraph styles persist in default/end properties and survive later text entry', () => {
  const d = fix2Document(
    '<a:p><a:pPr marL="123"/><a:endParaRPr lang="en-US"/></a:p>'
  )
  d.execute({
    type: 'object.update',
    ref: { part: fix2Part, id: '90' },
    patch: {
      style: {
        bold: true,
        fontFamily: 'Example Sans',
        color: '#123456',
        fontSize: 28,
      },
    },
  })
  const p = fix2Xml(d).getElementsByTagName('a:p')[0]!
  assert.equal(p.getElementsByTagName('a:defRPr')[0]?.getAttribute('b'), '1')
  assert.equal(
    p.getElementsByTagName('a:endParaRPr')[0]?.getAttribute('lang'),
    'en-US'
  )
  assert.equal(
    p.getElementsByTagName('a:endParaRPr')[0]?.getAttribute('b'),
    '1'
  )
  d.execute({
    type: 'text.set',
    ref: { part: fix2Part, id: '90' },
    text: 'Typed',
  })
  const style = d
    .getScene()
    .slides[0]!.objects.find((x) => x.id === '90')!.style!
  assert.equal(style.bold, true)
  assert.equal(style.fontFamily, 'Example Sans')
})
test('paragraph-only replacement removes old line break elements', () => {
  const d = fix2Document(
    '<a:p><a:r><a:t>Before</a:t></a:r><a:br><a:rPr b="1"/></a:br><a:r><a:t>After</a:t></a:r></a:p>'
  )
  d.execute({
    type: 'text.set',
    ref: { part: fix2Part, id: '90' },
    text: 'One\nTwo',
  })
  const parsed = fix2Xml(d)
  assert.equal(parsed.getElementsByTagName('a:br').length, 0)
  assert.equal(parsed.getElementsByTagName('a:p').length, 2)
  assert.equal(d.getScene().slides[0]!.objects[0]!.text, 'One\nTwo')
})
test('shape fill updates remove every existing fill choice and preserve extension namespace children', () => {
  for (const fill of ['pattFill', 'blipFill', 'grpFill']) {
    const d = fix2Document(
      '<a:p/>',
      `<a:${fill}/><x:solidFill xmlns:x="urn:extension"/><a:ln/><a:effectLst/>`
    )
    d.execute({
      type: 'object.update',
      ref: { part: fix2Part, id: '90' },
      patch: { fill: '#ABCDEF' },
    })
    const sp = fix2Xml(d).getElementsByTagName('p:spPr')[0]!
    assert.equal(sp.getElementsByTagName('a:' + fill).length, 0)
    assert.equal(sp.getElementsByTagName('x:solidFill').length, 1)
    assert.equal(sp.getElementsByTagName('a:solidFill').length, 1)
    assert.ok(fix2Kids(sp).indexOf('solidFill') < fix2Kids(sp).indexOf('ln'))
  }
})
test('run font and color modifications follow DrawingML child ordering', () => {
  const d = fix2Document(
    '<a:p><a:r><a:rPr><a:ln/><a:noFill/><a:effectLst/><a:ea typeface="CJK"/><a:cs typeface="CS"/><a:hlinkClick r:id="keep"/><a:extLst/></a:rPr><a:t>Styled</a:t></a:r></a:p>'
  )
  d.execute({
    type: 'text.set',
    ref: { part: fix2Part, id: '90' },
    text: 'Styled',
    style: { fontFamily: 'Latin', color: '#AABBCC' },
  })
  assert.deepEqual(fix2Kids(fix2Xml(d).getElementsByTagName('a:rPr')[0]!), [
    'ln',
    'solidFill',
    'effectLst',
    'latin',
    'ea',
    'cs',
    'hlinkClick',
    'extLst',
  ])
})
test('master level text style and slide color-map override cascade to an untyped placeholder', () => {
  const f = unzipSync(
    fix2Document(
      '<a:p><a:pPr lvl="1"/><a:r><a:t>Inherited</a:t></a:r></a:p>'
    ).export()
  )
  const master = 'ppt/slideMasters/slideMaster1.xml',
    layout = 'ppt/slideLayouts/slideLayout1.xml'
  f[layout] = strToU8(
    strFromU8(f[layout]!).replace(
      '</p:spTree>',
      fix2Shape('<a:p/>').replace(
        '<p:ph idx="7"/>',
        '<p:ph type="body" idx="7"/>'
      ) + '</p:spTree>'
    )
  )
  f[master] = strToU8(
    strFromU8(f[master]!).replace(
      '</p:sldMaster>',
      '<p:txStyles><p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr><a:lvl2pPr algn="ctr"><a:defRPr b="1" sz="2400"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/></a:defRPr></a:lvl2pPr></p:bodyStyle></p:txStyles></p:sldMaster>'
    )
  )
  f[fix2Part] = strToU8(
    strFromU8(f[fix2Part]!).replace(
      '<a:masterClrMapping/>',
      '<a:overrideClrMapping bg1="lt1" tx1="accent2" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
    )
  )
  const o = OfficeDocument.load(zipSync(f))
    .getScene()
    .slides[0]!.objects.find((x) => x.id === '90')!
  assert.equal(o.style!.bold, true)
  assert.equal(o.style!.fontSize, 32)
  assert.equal(o.style!.align, 'center')
  assert.equal(o.style!.color, '#ED7D31')
  assert.equal(o.style!.fontFamily, 'Arial')
})
test('partial run styling merges presentation, list and paragraph defaults without consuming extension properties', () => {
  const f = unzipSync(
    fix2Document(
      '<a:p><a:pPr><a:defRPr i="1"/></a:pPr><a:r><a:rPr b="1"><x:solidFill xmlns:x="urn:test"><x:srgbClr val="BADBAD"/></x:solidFill></a:rPr><a:t>Merged</a:t></a:r></a:p>'
    ).export()
  )
  f['ppt/presentation.xml'] = strToU8(
    strFromU8(f['ppt/presentation.xml']!).replace(
      '</p:presentation>',
      '<p:defaultTextStyle><a:lvl1pPr><a:defRPr sz="3000"><a:solidFill><a:srgbClr val="101112"/></a:solidFill></a:defRPr></a:lvl1pPr></p:defaultTextStyle></p:presentation>'
    )
  )
  f[fix2Part] = strToU8(
    strFromU8(f[fix2Part]!).replace(
      '<a:lstStyle/>',
      '<a:lstStyle><a:lvl1pPr><a:defRPr sz="2100"><a:latin typeface="List Sans"/></a:defRPr></a:lvl1pPr></a:lstStyle>'
    )
  )
  const style = OfficeDocument.load(zipSync(f))
    .getScene()
    .slides[0]!.objects.find((o) => o.id === '90')!.style!
  assert.equal(style.fontSize, 28)
  assert.equal(style.fontFamily, 'List Sans')
  assert.equal(style.bold, true)
  assert.equal(style.italic, true)
  assert.equal(style.color, '#101112')
})
test('scene exposes explicit soft breaks and valid false master visibility', () => {
  const f = unzipSync(
    fix2Document(
      '<a:p><a:r><a:t>A</a:t></a:r><a:br/><a:r><a:t>B</a:t></a:r></a:p>'
    ).export()
  )
  const master = 'ppt/slideMasters/slideMaster1.xml'
  f[master] = strToU8(
    strFromU8(f[master]!).replace(
      '</p:spTree>',
      fix2Shape('<a:p><a:r><a:t>Hidden</a:t></a:r></a:p>').replace(
        '<p:ph idx="7"/>',
        ''
      ) + '</p:spTree>'
    )
  )
  f[fix2Part] = strToU8(
    strFromU8(f[fix2Part]!).replace('<p:sld ', '<p:sld showMasterSp="false" ')
  )
  const objects = OfficeDocument.load(zipSync(f)).getScene().slides[0]!.objects
  assert.equal(objects.length, 1)
  assert.equal(objects[0]!.text, 'A\nB')
})
test('theme update follows an alternate theme relationship path', () => {
  const f = unzipSync(OfficeDocument.create().export())
  f['styles/alternate.xml'] = f['ppt/theme/theme1.xml']!
  delete f['ppt/theme/theme1.xml']
  const rp = 'ppt/slideMasters/_rels/slideMaster1.xml.rels'
  f[rp] = strToU8(
    strFromU8(f[rp]!).replace(
      '../theme/theme1.xml',
      '../../styles/alternate.xml'
    )
  )
  const ct = '[Content_Types].xml'
  f[ct] = strToU8(
    strFromU8(f[ct]!).replace('/ppt/theme/theme1.xml', '/styles/alternate.xml')
  )
  const d = OfficeDocument.load(zipSync(f))
  d.execute({
    type: 'theme.update',
    colors: { accent1: '#135790' },
    fontFamily: 'Theme Sans',
  })
  const parsed = fix2Xml(d, 'styles/alternate.xml')
  assert.equal(
    parsed
      .getElementsByTagName('a:accent1')[0]!
      .getElementsByTagName('a:srgbClr')[0]!
      .getAttribute('val'),
    '135790'
  )
  assert.equal(
    parsed.getElementsByTagName('a:latin')[0]!.getAttribute('typeface'),
    'Theme Sans'
  )
})
test('text color reads its direct fill rather than outline colors or extension lookalikes', () => {
  const d = fix2Document(
    '<a:p><a:r><a:rPr><a:ln><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></a:ln><a:solidFill><a:sysClr val="windowText" lastClr="246810"/></a:solidFill></a:rPr><a:t>Colored</a:t></a:r></a:p>'
  )
  assert.equal(d.getScene().slides[0]!.objects[0]!.style!.color, '#246810')
})
test('placeholder inherited list defaults use the slide paragraph level', () => {
  const f = unzipSync(
    fix2Document(
      '<a:p><a:pPr lvl="1"/><a:r><a:t>Level two</a:t></a:r></a:p>'
    ).export()
  )
  const layout = 'ppt/slideLayouts/slideLayout1.xml'
  const template = fix2Shape('<a:p/>')
    .replace('<p:ph idx="7"/>', '<p:ph type="body" idx="7"/>')
    .replace(
      '<a:lstStyle/>',
      '<a:lstStyle><a:lvl1pPr><a:defRPr sz="900"/></a:lvl1pPr><a:lvl2pPr><a:defRPr sz="2700"/></a:lvl2pPr></a:lstStyle>'
    )
  f[layout] = strToU8(
    strFromU8(f[layout]!).replace('</p:spTree>', template + '</p:spTree>')
  )
  const o = OfficeDocument.load(zipSync(f)).getScene().slides[0]!.objects[0]!
  assert.equal(o.style!.fontSize, 36)
})
test('default paragraph properties cascade underneath level-specific run properties', () => {
  const f = unzipSync(
    fix2Document('<a:p><a:r><a:t>Defaults</a:t></a:r></a:p>').export()
  )
  const p = 'ppt/presentation.xml'
  f[p] = strToU8(
    strFromU8(f[p]!).replace(
      '</p:presentation>',
      '<p:defaultTextStyle><a:defPPr algn="r"><a:defRPr i="1"/></a:defPPr><a:lvl1pPr><a:defRPr sz="2250"/></a:lvl1pPr></p:defaultTextStyle></p:presentation>'
    )
  )
  const s = OfficeDocument.load(zipSync(f)).getScene().slides[0]!.objects[0]!
    .style!
  assert.equal(s.italic, true)
  assert.equal(s.align, 'right')
  assert.equal(s.fontSize, 30)
})
test('typing into empty paragraph converts default or end properties into valid run properties', () => {
  for (const source of [
    '<a:pPr><a:defRPr b="1" sz="2100" lang="zh-CN"><a:solidFill><a:srgbClr val="314159"/></a:solidFill><a:latin typeface="Inherited Sans"/></a:defRPr></a:pPr>',
    '<a:endParaRPr b="1" sz="2100" lang="zh-CN"><a:solidFill><a:srgbClr val="314159"/></a:solidFill><a:latin typeface="Inherited Sans"/></a:endParaRPr>',
  ]) {
    const d = fix2Document(`<a:p>${source}</a:p>`)
    d.execute({
      type: 'text.set',
      ref: { part: fix2Part, id: '90' },
      text: 'Typed',
    })
    const parsed = fix2Xml(d),
      run = parsed.getElementsByTagName('a:r')[0]!
    assert.deepEqual(fix2Kids(run), ['rPr', 't'])
    const properties = run.getElementsByTagName('a:rPr')[0]!
    assert.equal(
      properties.namespaceURI,
      'http://schemas.openxmlformats.org/drawingml/2006/main'
    )
    assert.equal(properties.getAttribute('lang'), 'zh-CN')
    assert.equal(properties.getAttribute('b'), '1')
    assert.equal(properties.getAttribute('sz'), '2100')
    assert.deepEqual(fix2Kids(properties), ['solidFill', 'latin'])
    const style = OfficeDocument.load(d.export()).getScene().slides[0]!
      .objects[0]!.style!
    assert.equal(style.bold, true)
    assert.equal(style.fontSize, 28)
    assert.equal(style.color, '#314159')
    assert.equal(style.fontFamily, 'Inherited Sans')
  }
})

test('empty shapes gain an editable text body and preserve geometry on roundtrip', () => {
  const doc = OfficeDocument.create('Shapes')
  const part = doc.getScene().slides[0]!.part
  const ref = doc.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'shape',
      geometry: 'ellipse',
      frame: { x: 10, y: 20, width: 200, height: 80 },
    },
  }).ref!
  doc.execute({ type: 'text.set', ref, text: 'Shape label' })
  const result = OfficeDocument.load(doc.export()).getScene().slides[0]!
    .objects[0]!
  assert.equal(result.text, 'Shape label')
  assert.equal(result.geometry, 'ellipse')
  assert.equal(result.x, 10)
})
