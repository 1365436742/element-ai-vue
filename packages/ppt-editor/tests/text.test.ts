import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DOMParser } from '@xmldom/xmldom'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp } from 'vue'
import { readRichText } from '../src/drawing/text.js'
import { richTextContent } from '../src/ui/text.js'
const ns = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const parse = (xml: string) =>
  readRichText(
    new DOMParser().parseFromString(
      `<a:txBody xmlns:a="${ns}">${xml}</a:txBody>`,
      'text/xml'
    ).documentElement,
    ns,
    {
      baseStyle: () => ({ fontSize: 20, color: '#123456' }),
      readStyle: () => ({}),
      font: (name) => name,
      color: () => '#ff0000',
    }
  )
test('retains run styles, fields, explicit breaks, spaces and empty paragraphs', () => {
  const s = parse(
    '<a:bodyPr/><a:p><a:pPr><a:defRPr b="1"/></a:pPr><a:r><a:rPr sz="3000"/><a:t> A </a:t></a:r><a:br/><a:fld><a:rPr i="1"/><a:t>B</a:t></a:fld></a:p><a:p/>'
  )
  assert.equal(s.paragraphs.length, 2)
  assert.deepEqual(
    s.paragraphs[0].runs.map((r) => r.text),
    [' A ', '\n', 'B']
  )
  assert.equal(s.paragraphs[0].runs[0].style.fontSize, 40)
  assert.equal(s.paragraphs[0].runs[0].style.bold, true)
  assert.equal(s.paragraphs[0].runs[2].style.italic, true)
  assert.equal(s.paragraphs[1].runs.length, 0)
  assert.deepEqual(s.margins, { left: 9.6, right: 9.6, top: 4.8, bottom: 4.8 })
})
test('merges list defaults and level overrides with paragraph spacing and numbering resets', () => {
  const s = parse(
    '<a:lstStyle><a:defPPr marL="9525"><a:defRPr sz="1500"/></a:defPPr><a:lvl2pPr marL="19050" indent="-9525"><a:defRPr i="1"/><a:buAutoNum type="alphaLcParenR"/></a:lvl2pPr></a:lstStyle><a:p><a:pPr lvl="1"><a:spcBef><a:spcPts val="600"/></a:spcBef></a:pPr></a:p><a:p><a:pPr lvl="1"/></a:p><a:p><a:pPr lvl="1"><a:buAutoNum type="alphaLcParenR" startAt="4"/></a:pPr></a:p><a:p><a:pPr lvl="1"/></a:p>'
  )
  assert.deepEqual(
    s.paragraphs.map((p) => p.bullet?.text),
    ['a)', 'b)', 'd)', 'e)']
  )
  assert.equal(s.paragraphs[0].marginLeft, 2)
  assert.equal(s.paragraphs[0].indent, -1)
  assert.equal(s.paragraphs[0].spaceBefore?.value, 8)
  assert.equal(s.paragraphs[0].style.fontSize, 20)
  assert.equal(s.paragraphs[0].style.italic, true)
})
test('formats sample number styles and keeps independent nested counters', () => {
  const types = [
    'arabicPeriod',
    'circleNumDbPlain',
    'ea1JpnChsDbPeriod',
    'romanUcPeriod',
    'alphaUcPeriod',
    'alphaLcParenR',
    'alphaLcPeriod',
  ]
  assert.deepEqual(
    types.map(
      (type) =>
        parse(
          `<a:p><a:pPr><a:buAutoNum type="${type}" startAt="2"/></a:pPr></a:p>`
        ).paragraphs[0].bullet?.text
    ),
    ['2.', '②', '二.', 'II.', 'B.', 'b)', 'b.']
  )
  const s = parse(
    '<a:p><a:pPr><a:buAutoNum type="arabicPeriod"/></a:pPr></a:p><a:p><a:pPr lvl="1"><a:buAutoNum type="arabicPeriod"/></a:pPr></a:p><a:p><a:pPr><a:buAutoNum type="arabicPeriod"/></a:pPr></a:p><a:p><a:pPr lvl="1"><a:buAutoNum type="arabicPeriod"/></a:pPr></a:p>'
  )
  assert.deepEqual(
    s.paragraphs.map((p) => p.bullet?.text),
    ['1.', '1.', '2.', '1.']
  )
})
test('renders safe inline DOM with vertical modes and baseline styling', async () => {
  const s = parse(
    '<a:bodyPr vert="vert270" anchor="ctr" wrap="none"/><a:p><a:r><a:rPr baseline="30000"/><a:t>&lt;script&gt;</a:t></a:r></a:p>'
  )
  const html = await renderToString(
    createSSRApp({ render: () => richTextContent(s) })
  )
  assert.match(html, /writing-mode:sideways-lr/)
  assert.match(html, /width:100%;height:100%/)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /vertical-align:30%/)
  assert.match(html, /justify-content:center/)
})

test(
  'parses original user sample slides without changing text or source bytes',
  { skip: !process.env.PPT_SAMPLE_PATH },
  async () => {
    const { readFile } = await import('node:fs/promises')
    const { unzipSync, strFromU8 } = await import('fflate')
    const path = process.env.PPT_SAMPLE_PATH!
    const bytes = await readFile(path)
    const parts = unzipSync(bytes)
    const numbering = new Set<string>()
    let bodies = 0
    for (const slide of [1, 5, 6]) {
      const doc = new DOMParser().parseFromString(
        strFromU8(parts[`ppt/slides/slide${slide}.xml`]),
        'text/xml'
      )
      for (const body of Array.from(doc.getElementsByTagName('*')).filter(
        (node) => node.localName === 'txBody'
      )) {
        const before = body.toString()
        const scene = readRichText(body, ns, {
          baseStyle: () => ({ fontSize: 18 }),
          readStyle: () => ({}),
          font: (name) => name,
          color: () => undefined,
        })
        const paragraphs = Array.from(body.childNodes).filter(
          (n) => n.nodeType === 1 && n.localName === 'p'
        )
        assert.equal(scene.paragraphs.length, paragraphs.length)
        paragraphs.forEach((paragraph, index) => {
          const expected = Array.from(paragraph.childNodes)
            .filter(
              (n) =>
                n.nodeType === 1 && ['r', 'fld', 'br'].includes(n.localName!)
            )
            .map((n) =>
              n.localName === 'br'
                ? '\n'
                : Array.from(n.childNodes).find((c) => c.localName === 't')
                    ?.textContent || ''
            )
            .join('')
          assert.equal(
            scene.paragraphs[index].runs.map((r) => r.text).join(''),
            expected
          )
        })
        for (const node of Array.from(
          body.getElementsByTagNameNS(ns, 'buAutoNum')
        ))
          numbering.add(node.getAttribute('type')!)
        assert.equal(body.toString(), before)
        bodies++
      }
    }
    assert.ok(bodies > 20)
    assert.deepEqual(
      [...numbering].sort(),
      [
        'alphaLcParenR',
        'alphaLcPeriod',
        'alphaUcPeriod',
        'arabicPeriod',
        'circleNumDbPlain',
        'ea1JpnChsDbPeriod',
        'romanUcPeriod',
      ].sort()
    )
    assert.deepEqual(await readFile(path), bytes)
  }
)

test('keeps vertical text in its nonsquare box using native writing axes', async () => {
  for (const [mode, cssMode] of [
    ['vert', 'vertical-rl'],
    ['vert270', 'sideways-lr'],
    ['eaVert', 'vertical-rl'],
  ]) {
    const scene = parse(
      `<a:bodyPr vert="${mode}"/><a:p><a:r><a:t>中文</a:t></a:r></a:p>`
    )
    const { h } = await import('vue')
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h('div', { style: { width: '300px', height: '80px' } }, [
            richTextContent(scene),
          ]),
      })
    )
    assert.match(html, /width:300px;height:80px/)
    assert.ok(html.includes(`writing-mode:${cssMode}`))
    assert.match(html, /width:100%;height:100%/)
    assert.doesNotMatch(html, /rotate\(/)
    if (mode === 'eaVert') assert.match(html, /text-orientation:upright/)
  }
})

test('bounds malformed numbering and saturated counters without hanging', async () => {
  const { spawnSync } = await import('node:child_process')
  const script = `import assert from 'node:assert/strict'; import {DOMParser} from '@xmldom/xmldom'; import {readRichText} from './src/drawing/text.ts';
 const ns='http://schemas.openxmlformats.org/drawingml/2006/main';
 for(const type of ['romanUcPeriod','alphaLcPeriod']) for(const start of ['Infinity','1e100','NaN','0','-1','2.5','32768']) {
 const body=new DOMParser().parseFromString('<a:txBody xmlns:a="'+ns+'"><a:p><a:pPr><a:buAutoNum type="'+type+'" startAt="'+start+'"/></a:pPr></a:p></a:txBody>','text/xml').documentElement;
 const scene=readRichText(body,ns,{baseStyle:()=>({}),readStyle:()=>({}),font:()=>undefined,color:()=>undefined}); assert.equal(scene.paragraphs[0].bullet.text,type==='romanUcPeriod'?'I.':'a.'); }
 const body=new DOMParser().parseFromString('<a:txBody xmlns:a="'+ns+'"><a:p><a:pPr><a:buAutoNum type="arabicPeriod" startAt="32767"/></a:pPr></a:p><a:p><a:pPr><a:buAutoNum type="arabicPeriod"/></a:pPr></a:p></a:txBody>','text/xml').documentElement;
 assert.deepEqual(readRichText(body,ns,{baseStyle:()=>({}),readStyle:()=>({}),font:()=>undefined,color:()=>undefined}).paragraphs.map(p=>p.bullet.text),['32767.','32767.']);`
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--input-type=module', '-e', script],
    { cwd: new URL('..', import.meta.url), timeout: 2000, encoding: 'utf8' }
  )
  assert.equal(
    result.error,
    undefined,
    `numbering subprocess exceeded bound: ${result.error}`
  )
  assert.equal(result.status, 0, result.stderr)
})
test('nearest bullet alternatives override inherited values and follow first run text', () => {
  const defaults =
    '<a:lstStyle><a:defPPr><a:buChar char="•"/><a:buFont typeface="Old"/><a:buClr><a:srgbClr val="000000"/></a:buClr><a:buSzPct val="50000"/></a:defPPr></a:lstStyle>'
  const p = '<a:p><a:pPr><a:buSzPts val="2400"/></a:pPr></a:p>'
  assert.deepEqual(parse(defaults + p).paragraphs[0].bullet?.size, {
    unit: 'px',
    value: 32,
  })
  const scene = parse(
    defaults +
      '<a:p><a:pPr><a:buFontTx/><a:buClrTx/><a:buSzTx/></a:pPr><a:r><a:rPr sz="3000"><a:latin typeface="Run Font"/><a:solidFill><a:srgbClr val="ff0000"/></a:solidFill></a:rPr><a:t>A</a:t></a:r></a:p>'
  )
  assert.equal(scene.paragraphs[0].bullet?.fontFamily, 'Run Font')
  assert.equal(scene.paragraphs[0].bullet?.color, '#ff0000')
  assert.deepEqual(scene.paragraphs[0].bullet?.size, { unit: 'px', value: 40 })
  const reversed = parse(
    '<a:lstStyle><a:defPPr><a:buChar char="•"/><a:buSzPts val="2400"/></a:defPPr></a:lstStyle><a:p><a:pPr><a:buSzPct val="75000"/></a:pPr></a:p>'
  )
  assert.deepEqual(reversed.paragraphs[0].bullet?.size, {
    unit: 'percent',
    value: 75,
  })
})
test('percentage paragraph spacing uses largest effective run size on the block axis', async () => {
  for (const mode of ['horz', 'vert', 'vert270']) {
    const scene = parse(
      `<a:bodyPr vert="${mode}"/><a:p><a:pPr><a:spcBef><a:spcPct val="100000"/></a:spcBef><a:spcAft><a:spcPct val="50000"/></a:spcAft></a:pPr><a:r><a:t>A</a:t></a:r><a:r><a:rPr sz="3000"/><a:t>B</a:t></a:r></a:p>`
    )
    const html = await renderToString(
      createSSRApp({ render: () => richTextContent(scene) })
    )
    assert.match(html, /margin-block-start:40px/)
    assert.match(html, /margin-block-end:20px/)
  }
})

test('percentage spacing uses actual smaller runs and empty paragraph fallback', async () => {
  const scene = parse(
    '<a:p><a:pPr><a:spcBef><a:spcPct val="100000"/></a:spcBef></a:pPr><a:r><a:rPr sz="750"/><a:t>Small</a:t></a:r></a:p><a:p><a:pPr><a:spcBef><a:spcPct val="100000"/></a:spcBef></a:pPr></a:p>'
  )
  const html = await renderToString(
    createSSRApp({ render: () => richTextContent(scene) })
  )
  assert.match(html, /margin-block-start:10px/)
  assert.match(html, /margin-block-start:20px/)
})

test('computes spacing for 150000 short runs without runtime argument limits', () => {
  const scene = parse(
    '<a:p><a:pPr><a:spcBef><a:spcPct val="100000"/></a:spcBef></a:pPr></a:p>'
  )
  scene.paragraphs[0].runs = Array.from({ length: 150000 }, (_, index) => ({
    text: 'a',
    style: { fontSize: index === 149999 ? 14 : 10 },
  }))
  const root = richTextContent(scene)
  const paragraph = (root.children as import('vue').VNode[])[0]
  assert.equal(paragraph.props?.style.marginBlockStart, '14px')
  assert.equal((paragraph.children as import('vue').VNode[]).length, 150000)
})
