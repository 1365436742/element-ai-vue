import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DOMParser } from '@xmldom/xmldom'
import { diagramNodes } from '../src/core/diagram.js'
const parse = (xml: string) =>
  new DOMParser().parseFromString(xml, 'application/xml')
const D = 'http://schemas.openxmlformats.org/drawingml/2006/diagram'
const S = 'http://schemas.microsoft.com/office/drawing/2008/diagram'
test('diagram nodes associate cached shapes with authoritative model IDs, not repeated shape IDs', () => {
  const data = parse(
    `<dgm:dataModel xmlns:dgm="${D}"><dgm:ptLst><dgm:pt modelId="source"/><dgm:pt modelId="pres" type="pres"><dgm:prSet presAssocID="source"/></dgm:pt></dgm:ptLst></dgm:dataModel>`
  )
  const drawing = parse(
    `<dsp:drawing xmlns:dsp="${S}"><dsp:spTree><dsp:sp modelId="pres"><dsp:nvSpPr><dsp:cNvPr id="0"/></dsp:nvSpPr></dsp:sp><dsp:sp modelId="decoration"><dsp:nvSpPr><dsp:cNvPr id="0"/></dsp:nvSpPr></dsp:sp></dsp:spTree></dsp:drawing>`
  )
  const nodes = diagramNodes(data, drawing)
  assert.deepEqual(
    nodes.map((n) => [n.modelId, n.dataId]),
    [
      ['pres', 'source'],
      ['decoration', undefined],
    ]
  )
  assert.equal(nodes[0]!.point?.getAttribute('modelId'), 'source')
  assert.equal(nodes[0]!.shape.getAttribute('modelId'), 'pres')
})
test('diagram associations reject ambiguous model identities and do not use nested extension points', () => {
  const drawing = parse(
    `<dsp:drawing xmlns:dsp="${S}"><dsp:spTree><dsp:sp modelId="pres"/></dsp:spTree></dsp:drawing>`
  )
  const data = parse(
    `<dgm:dataModel xmlns:dgm="${D}"><dgm:ptLst><dgm:pt modelId="source"/><dgm:pt modelId="source"/></dgm:ptLst></dgm:dataModel>`
  )
  assert.throws(() => diagramNodes(data, drawing), /Duplicate diagram/)
})

test('diagram cached drawing exposes editable source text and real geometry', async () => {
  const { readDiagramObjects } = await import('../src/core/diagram.js')
  const A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
  const data = parse(
    `<dgm:dataModel xmlns:dgm="${D}"><dgm:ptLst><dgm:pt modelId="source"/><dgm:pt modelId="pres" type="pres"><dgm:prSet presAssocID="source"/></dgm:pt></dgm:ptLst></dgm:dataModel>`
  )
  const drawing = parse(
    `<dsp:drawing xmlns:dsp="${S}" xmlns:a="${A}"><dsp:spTree><dsp:sp modelId="pres"><dsp:nvSpPr><dsp:cNvPr id="0"/></dsp:nvSpPr><dsp:spPr><a:xfrm><a:off x="95250" y="190500"/><a:ext cx="952500" cy="952500"/></a:xfrm><a:prstGeom prst="ellipse"/></dsp:spPr><dsp:txBody><a:bodyPr anchor="ctr"/><a:p><a:r><a:rPr sz="1800"/><a:t>Node</a:t></a:r></a:p></dsp:txBody><dsp:txXfrm><a:off x="190500" y="285750"/><a:ext cx="762000" cy="762000"/></dsp:txXfrm></dsp:sp></dsp:spTree></dsp:drawing>`
  )
  const result = readDiagramObjects(data, drawing, 'drawing.xml', A, {
    color: () => undefined,
    font: (n) => n,
    readStyle: () => ({}),
  })
  assert.equal(result[0]!.id, 'pres')
  assert.equal(result[0]!.x, 10)
  assert.equal(result[0]!.text, 'Node')
  assert.equal(result[0]!.richText?.paragraphs[0]?.runs[0]?.style.fontSize, 24)
  assert.ok(result[0]!.paths?.[0]?.d.includes('A'))
  assert.deepEqual(result[0]!.textRect, { x: 10, y: 10, width: 80, height: 80 })
})

test(
  'original SmartArt renders cached shapes and edits both model and cached text',
  { skip: !process.env.PPT_SAMPLE_PATH },
  async () => {
    const { readFileSync } = await import('node:fs')
    const { OfficeDocument } = await import('../src/core/index.js')
    const { unzipSync, strFromU8 } = await import('fflate')
    const doc = OfficeDocument.load(
      new Uint8Array(readFileSync(process.env.PPT_SAMPLE_PATH!))
    )
    const diagrams = doc
      .getScene()
      .slides[10]!.objects.filter((o) => o.kind === 'diagram')
    assert.equal(diagrams.length, 2)
    assert.ok(diagrams[0]!.children!.length >= 10)
    const target = diagrams[0]!.diagramTexts!.find((n) => n.text === '爱情')!
    assert.ok(target)
    doc.execute({
      type: 'diagram.text.set',
      ref: diagrams[0]!,
      nodeId: target.id,
      text: '新的节点',
    })
    const out = doc.export(),
      parts = unzipSync(out)
    assert.match(strFromU8(parts['ppt/diagrams/data1.xml']!), /新的节点/)
    assert.match(strFromU8(parts['ppt/diagrams/drawing1.xml']!), /新的节点/)
    const scene = OfficeDocument.load(out).getScene()
    assert.ok(
      scene.slides[10]!.objects.find(
        (o) => o.id === diagrams[0]!.id
      )!.children!.some((n) => n.text === '新的节点')
    )
    const before = doc.export()
    assert.throws(
      () =>
        doc.execute({
          type: 'diagram.text.set',
          ref: diagrams[0]!,
          nodeId: 'missing',
          text: 'no',
        }),
      /node/i
    )
    assert.deepEqual(doc.export(), before)
  }
)

test(
  'SmartArt resizing updates cached geometry and rejects shared drawing mutation',
  { skip: !process.env.PPT_SAMPLE_PATH },
  async () => {
    const { readFileSync } = await import('node:fs')
    const { OfficeDocument } = await import('../src/core/index.js')
    const { unzipSync, zipSync, strFromU8, strToU8 } = await import('fflate')
    const input = new Uint8Array(readFileSync(process.env.PPT_SAMPLE_PATH!)),
      doc = OfficeDocument.load(input)
    const diagram = doc
      .getScene()
      .slides[10]!.objects.find((o) => o.kind === 'diagram')!
    const child = diagram.children![0]!
    doc.execute({
      type: 'object.update',
      ref: diagram,
      patch: { width: diagram.width * 2, height: diagram.height * 2 },
    })
    const resized = OfficeDocument.load(doc.export())
      .getScene()
      .slides[10]!.objects.find((o) => o.id === diagram.id)!
    assert.ok(Math.abs(resized.children![0]!.width - child.width * 2) < 0.001)
    assert.ok(Math.abs(resized.children![0]!.x - child.x * 2) < 0.001)
    const parts = unzipSync(input),
      part = 'ppt/slides/slide11.xml',
      xml = strFromU8(parts[part]!)
    const frame = xml
      .match(/<p:graphicFrame>.*?<\/p:graphicFrame>/)![0]!
      .replace('id="6"', 'id="99"')
    parts[part] = strToU8(xml.replace('</p:spTree>', frame + '</p:spTree>'))
    const shared = OfficeDocument.load(zipSync(parts)),
      before = shared.export()
    assert.throws(
      () =>
        shared.execute({
          type: 'diagram.text.set',
          ref: diagram,
          nodeId: diagram.diagramTexts![0]!.id,
          text: 'Change',
        }),
      /Shared diagram/
    )
    assert.deepEqual(shared.export(), before)
  }
)

test(
  'SmartArt in scaled ordinary group retains local coordinates through resize',
  { skip: !process.env.PPT_SAMPLE_PATH },
  async () => {
    const { readFileSync } = await import('node:fs')
    const { OfficeDocument } = await import('../src/core/index.js')
    const { unzipSync, zipSync, strFromU8, strToU8 } = await import('fflate')
    const input = new Uint8Array(readFileSync(process.env.PPT_SAMPLE_PATH!))
    const original = OfficeDocument.load(input)
      .getScene()
      .slides[10]!.objects.find((o) => o.kind === 'diagram')!
    const parts = unzipSync(input),
      part = 'ppt/slides/slide11.xml'
    const xml = strFromU8(parts[part]!)
    const frame = xml.match(/<p:graphicFrame>.*?<\/p:graphicFrame>/)![0]!
    const group = `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="999" name="Scaled"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1905000" cy="2857500"/><a:chOff x="0" y="0"/><a:chExt cx="952500" cy="952500"/></a:xfrm></p:grpSpPr>${frame}</p:grpSp>`
    parts[part] = strToU8(xml.replace(frame, group))
    const doc = OfficeDocument.load(zipSync(parts))
    const grouped = doc
      .getScene()
      .slides[10]!.objects.find((o) => o.id === original.id)!
    assert.equal(grouped.width, original.width * 2)
    assert.equal(grouped.height, original.height * 3)
    assert.deepEqual(grouped.childCoordinateSize, {
      width: original.width,
      height: original.height,
    })
    assert.deepEqual(grouped.children, original.children)
    doc.execute({
      type: 'object.update',
      ref: grouped,
      patch: { width: grouped.width * 2, height: grouped.height * 2 },
    })
    const resized = OfficeDocument.load(doc.export())
      .getScene()
      .slides[10]!.objects.find((o) => o.id === original.id)!
    const size = resized.childCoordinateSize!
    assert.ok(Math.abs(size.width - original.width * 2) < 0.001)
    assert.ok(Math.abs(size.height - original.height * 2) < 0.001)
    assert.ok(
      Math.abs(resized.children![0]!.width - original.children![0]!.width * 2) <
        0.001
    )
  }
)

test(
  'SmartArt rejects missing associated cached text body without mutating any parts',
  { skip: !process.env.PPT_SAMPLE_PATH },
  async () => {
    const { readFileSync } = await import('node:fs')
    const { OfficeDocument } = await import('../src/core/index.js')
    const { unzipSync, zipSync, strFromU8, strToU8 } = await import('fflate')
    const input = new Uint8Array(readFileSync(process.env.PPT_SAMPLE_PATH!))
    const parts = unzipSync(input),
      drawingPart = 'ppt/diagrams/drawing1.xml'
    const drawing = parse(strFromU8(parts[drawingPart]!))
    const data = parse(strFromU8(parts['ppt/diagrams/data1.xml']!))
    const target = diagramNodes(data, drawing).find(
      (n) => n.point && n.shape.getElementsByTagNameNS(S, 'txBody').length
    )!
    const body = target.shape.getElementsByTagNameNS(S, 'txBody')[0]!
    target.shape.removeChild(body)
    parts[drawingPart] = strToU8(drawing.toString())
    const doc = OfficeDocument.load(zipSync(parts)),
      before = doc.export()
    const diagram = doc
      .getScene()
      .slides[10]!.objects.find((o) => o.kind === 'diagram')!
    assert.throws(
      () =>
        doc.execute({
          type: 'diagram.text.set',
          ref: diagram,
          nodeId: target.dataId!,
          text: 'Rejected',
        }),
      /cached text body/i
    )
    assert.deepEqual(doc.export(), before)
  }
)
