import { test } from 'node:test'
import assert from 'node:assert/strict'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { OfficeDocument } from '../src/core/index.js'
import { validateAsset } from '../src/core/validate.js'
import { objectContent } from '../src/ui/scene.js'
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
const part = 'ppt/slides/slide1.xml'
function fixture(media = false) {
  const doc = OfficeDocument.create()
  const ref = doc.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'image',
      frame: { x: 1, y: 2, width: 100, height: 80 },
      data: png,
      mimeType: 'image/png',
    },
  }).ref!
  const parts = unzipSync(doc.export())
  parts[part] = strToU8(
    strFromU8(parts[part]!)
      .replace('<a:stretch>', '<a:srcRect l="37302" r="-10000"/><a:stretch>')
      .replace(
        '<p:cNvPicPr/><p:nvPr/>',
        '<p:cNvPicPr/>' +
          (media
            ? '<p:nvPr><a:videoFile r:link="rVideo"/><p:extLst><p:ext uri="opaque"><p14:media xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" r:embed="rMedia"/></p:ext></p:extLst></p:nvPr>'
            : '<p:nvPr><p:extLst><p:ext uri="opaque"/></p:extLst></p:nvPr>')
      )
  )
  if (media) {
    parts['ppt/slides/_rels/slide1.xml.rels'] = strToU8(
      strFromU8(parts['ppt/slides/_rels/slide1.xml.rels']!).replace(
        '</Relationships>',
        '<Relationship Id="rVideo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/video" Target="../media/sample.mp4"/><Relationship Id="rMedia" Type="http://schemas.microsoft.com/office/2007/relationships/media" Target="../media/sample.mp4"/></Relationships>'
      )
    )
    parts['ppt/media/sample.mp4'] = new Uint8Array([
      0, 0, 0, 16, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 0,
    ])
    parts['[Content_Types].xml'] = strToU8(
      strFromU8(parts['[Content_Types].xml']!).replace(
        '</Types>',
        '<Default Extension="mp4" ContentType="video/mp4"/></Types>'
      )
    )
  }
  return { doc: OfficeDocument.load(zipSync(parts)), ref }
}
test('image crop scene and replacement preserve identity geometry opaque XML and original bytes', () => {
  const { doc, ref } = fixture()
  assert.equal(doc.getScene().slides[0]!.objects[0]!.crop?.left, 0.37302)
  doc.execute({
    type: 'image.crop',
    ref,
    crop: { left: 0.1, right: -0.2, top: 0, bottom: 0 },
  })
  doc.execute({
    type: 'resource.replace',
    ref,
    data: png,
    mimeType: 'image/png',
  })
  const o = OfficeDocument.load(doc.export()).getScene().slides[0]!.objects[0]!
  assert.equal(o.id, ref.id)
  assert.equal(o.x, 1)
  assert.equal(o.crop?.right, -0.2)
  assert.match(strFromU8(unzipSync(doc.export())[part]!), /uri="opaque"/)
  assert.deepEqual(unzipSync(doc.export())['ppt/media/image1.png'], png)
  const v = objectContent(o)
  assert.equal(v.type, 'div')
  assert.match(JSON.stringify(v.props), /hidden/)
})
test('embedded media renders controls and replacement updates both relationship targets atomically', () => {
  const { doc, ref } = fixture(true)
  let o = doc.getScene().slides[0]!.objects[0]!
  assert.equal(o.kind, 'media')
  assert.equal(o.mediaType, 'video')
  assert.match(o.poster!, /^data:image\/png/)
  assert.equal(objectContent(o).props?.controls, true)
  const data = new Uint8Array([
    0, 0, 0, 16, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 0,
  ])
  doc.execute({ type: 'resource.replace', ref, data, mimeType: 'video/mp4' })
  const rel = strFromU8(
    unzipSync(doc.export())['ppt/slides/_rels/slide1.xml.rels']!
  )
  assert.equal(
    [...rel.matchAll(/Target="([^"]+\.mp4)"/g)]
      .map((x) => x[1])
      .filter((x, _, a) => x === a[0]).length,
    2
  )
  const before = doc.export()
  assert.throws(() =>
    doc.execute({
      type: 'resource.replace',
      ref,
      data: png,
      mimeType: 'video/mp4',
    })
  )
  assert.deepEqual(doc.export(), before)
  assert.throws(() =>
    doc.execute({
      type: 'image.crop',
      ref,
      crop: { left: 0.9, right: 0.9, top: 0, bottom: 0 },
    })
  )
  assert.deepEqual(doc.export(), before)
})

test('crop geometry uses asymmetric negative fractions and native controls isolate gestures', () => {
  const { doc } = fixture()
  const o = doc.getScene().slides[0]!.objects[0]!
  o.crop = { left: 0.2, right: -0.1, top: -0.2, bottom: 0.1 }
  const v = objectContent(o),
    img = (v.children as any[])[0]
  assert.equal(img.props.style.width, `${100 / 0.9}%`)
  assert.equal(img.props.style.left, `${-20 / 0.9}%`)
  o.kind = 'media'
  o.mediaType = 'video'
  const a = objectContent(o)
  assert.equal(a.type, 'video')
  assert.equal(a.props?.autoplay, false)
  assert.equal(a.props?.preload, 'none')
  let stopped = false
  a.props?.onPointerdown({
    stopPropagation() {
      stopped = true
    },
  })
  assert.equal(stopped, true)
  assert.equal(objectContent(o, true).type, 'div')
})
test('optional original sample has page 7 crop and page 12 embedded audio video', async (t) => {
  if (!process.env.PPT_SAMPLE_PATH) {
    t.skip('PPT_SAMPLE_PATH not set')
    return
  }
  const { readFile } = await import('node:fs/promises')
  const doc = OfficeDocument.load(
    new Uint8Array(await readFile(process.env.PPT_SAMPLE_PATH))
  )
  const scene = doc.getScene()
  assert.ok(
    scene.slides[6]!.objects.some((o) =>
      Object.values(o.crop ?? {}).includes(0.37302)
    )
  )
  assert.deepEqual(
    scene.slides[11]!.objects.filter((o) => o.kind === 'media')
      .map((o) => o.mediaType)
      .sort(),
    ['audio', 'video']
  )
})
test('external media and MIME spoofing never allow replacement or mutate package', () => {
  const { doc, ref } = fixture(true)
  const parts = unzipSync(doc.export())
  parts['ppt/slides/_rels/slide1.xml.rels'] = strToU8(
    strFromU8(parts['ppt/slides/_rels/slide1.xml.rels']!).replace(
      'Id="rVideo"',
      'TargetMode="External" Id="rVideo"'
    )
  )
  const external = OfficeDocument.load(zipSync(parts)),
    before = external.export()
  assert.throws(() =>
    external.execute({
      type: 'resource.replace',
      ref,
      data: new Uint8Array([73, 68, 51]),
      mimeType: 'audio/mpeg',
    })
  )
  assert.deepEqual(external.export(), before)
  const image = fixture()
  const original = image.doc.export()
  for (const crop of [
    { left: NaN, right: 0, top: 0, bottom: 0 },
    { left: 11, right: 0, top: 0, bottom: 0 },
  ])
    assert.throws(() =>
      image.doc.execute({ type: 'image.crop', ref: image.ref, crop })
    )
  assert.throws(() =>
    image.doc.execute({
      type: 'resource.replace',
      ref: image.ref,
      data: png,
      mimeType: 'image/svg+xml',
    })
  )
  assert.deepEqual(image.doc.export(), original)
})
test('media MIME declaration with nonmedia bytes is not exposed as playable source', () => {
  const { doc } = fixture(true),
    parts = unzipSync(doc.export())
  parts['ppt/media/sample.mp4'] = png
  const scene = OfficeDocument.load(zipSync(parts)).getScene()
  assert.notEqual(scene.slides[0]!.objects[0]!.kind, 'media')
})

test('replacement isolates shared image and media rIds and preserves opaque references', () => {
  for (const media of [false, true]) {
    const { doc, ref } = fixture(media),
      parts = unzipSync(doc.export())
    let source = strFromU8(parts[part]!)
    const pic = source.match(/<p:pic>[\s\S]*?<\/p:pic>/)![0]
    source = source.replace(
      '</p:spTree>',
      pic.replace(`id="${ref.id}"`, `id="99"`) + '</p:spTree>'
    )
    source = source.replace(
      '</p:pic>',
      '<p:extLst><p:ext uri="opaque-ref"><z:keep xmlns:z="urn:opaque" r:embed="' +
        (media ? 'rMedia' : pic.match(/r:embed="([^"]+)"/)![1]) +
        '"/></p:ext></p:extLst></p:pic>'
    )
    parts[part] = strToU8(source)
    const loaded = OfficeDocument.load(zipSync(parts))
    const before = loaded
      .getScene()
      .slides[0]!.objects.filter((o) => o.kind === (media ? 'media' : 'image'))
    loaded.execute({
      type: 'resource.replace',
      ref,
      data: media
        ? new Uint8Array([
            0, 0, 0, 16, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 0,
          ])
        : new Uint8Array([...png, 1]),
      mimeType: media ? 'video/mp4' : 'image/png',
    })
    const output = unzipSync(loaded.export()),
      after = loaded
        .getScene()
        .slides[0]!.objects.filter(
          (o) => o.kind === (media ? 'media' : 'image')
        )
    assert.equal(after[1]!.src, before[1]!.src)
    const xml = strFromU8(output[part]!)
    assert.ok(
      xml.includes(
        '<z:keep xmlns:z="urn:opaque" r:embed="' +
          (media ? 'rMedia' : pic.match(/r:embed="([^"]+)"/)![1]) +
          '"/>'
      )
    )
    const selected = xml.match(/<p:pic>[\s\S]*?<\/p:pic>/)![0]
    if (media) {
      assert.doesNotMatch(selected, /<a:videoFile r:link="rVideo"/)
      assert.doesNotMatch(selected, /<p14:media[^>]*r:embed="rMedia"/)
    } else assert.notEqual(after[0]!.src, before[0]!.src)
  }
})
test('crop insertion precedes tile in imported blipFill', () => {
  const { doc, ref } = fixture(),
    parts = unzipSync(doc.export())
  parts[part] = strToU8(
    strFromU8(parts[part]!)
      .replace(/<a:srcRect[^>]*\/>/, '')
      .replace('<a:stretch><a:fillRect/></a:stretch>', '<a:tile/>')
  )
  const loaded = OfficeDocument.load(zipSync(parts))
  loaded.execute({
    type: 'image.crop',
    ref,
    crop: { left: 0.1, right: 0, top: 0, bottom: 0 },
  })
  assert.match(
    strFromU8(unzipSync(loaded.export())[part]!),
    /<a:blip[^>]*\/><a:srcRect[^>]*\/><a:tile\/>/
  )
})
test('AVIF ftyp, invalid MPEG framing and SVG CSS external fetch features are rejected atomically', () => {
  const { doc, ref } = fixture()
  for (const [mime, data] of [
    [
      'video/mp4',
      new Uint8Array([
        0, 0, 0, 16, 102, 116, 121, 112, 97, 118, 105, 102, 0, 0, 0, 0,
      ]),
    ],
    ['audio/mpeg', new Uint8Array([255, 224])],
    ...[
      '<svg><style>@import "https://example.com/a.css";</style></svg>',
      '<svg><style>.x{fill:url(https://example.com/a)}</style></svg>',
      '<svg style="fill:u\\72l(https://example.com/a)"/>',
    ].map((s) => ['image/svg+xml', strToU8(s)]),
  ] as [string, Uint8Array][]) {
    const before = doc.export()
    assert.throws(() => validateAsset(data, mime))
    assert.throws(() =>
      doc.execute({ type: 'resource.replace', ref, data, mimeType: mime })
    )
    assert.deepEqual(doc.export(), before)
  }
})
