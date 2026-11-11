import { DOMParser } from '@xmldom/xmldom'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shapeGeometry } from '../src/drawing/geometry'
const xml = (s: string) =>
  new DOMParser().parseFromString(s, 'application/xml').documentElement
const custom = (s: string) => xml(`<custGeom>${s}</custGeom>`)
test('custom guides, adjustments, coordinate scaling and quadratic/cubic paths', () => {
  const g = shapeGeometry(
    custom(
      `<avLst><gd name="adj" fmla="val 25"/></avLst><gdLst><gd name="x" fmla="*/ adj 2 1"/></gdLst><rect l="0" t="0" r="w" b="h"/><pathLst><path w="100" h="100" fill="none" stroke="0"><moveTo><pt x="x" y="0"/></moveTo><lnTo><pt x="100" y="100"/></lnTo><quadBezTo><pt x="50" y="50"/><pt x="0" y="100"/></quadBezTo><cubicBezTo><pt x="0" y="0"/><pt x="50" y="50"/><pt x="100" y="0"/></cubicBezTo><close/></path></pathLst>`
    ),
    200,
    100
  )!
  assert.equal(
    g.paths[0]!.d,
    'M 100 0 L 200 100 Q 100 50 0 100 C 0 0 100 50 200 0 Z'
  )
  assert.deepEqual(
    g.paths[0] && { fill: g.paths[0].fill, stroke: g.paths[0].stroke },
    { fill: 'none', stroke: false }
  )
  assert.deepEqual(g.textRect, { x: 0, y: 0, width: 200, height: 100 })
})
test('non-square arc uses radial DrawingML angles and splits complete circles', () => {
  const g = shapeGeometry(
    custom(
      '<pathLst><path w="200" h="100"><moveTo><pt x="100" y="50"/></moveTo><arcTo wR="100" hR="50" stAng="0" swAng="21600000"/></path></pathLst>'
    ),
    200,
    100
  )!
  assert.equal((g.paths[0]!.d.match(/A /g) || []).length, 4)
  assert.match(g.paths[0]!.d, /A 100 50 0 0 1 0 100/)
  const q = shapeGeometry(
    custom(
      '<pathLst><path w="200" h="100"><moveTo><pt x="100" y="0"/></moveTo><arcTo wR="100" hR="50" stAng="0" swAng="2700000"/></path></pathLst>'
    ),
    200,
    100
  )!
  const end = q.paths[0]!.d.split(' ').slice(-2).map(Number)
  assert.ok(Math.abs(end[0]! - end[1]!) < 0.0001)
  assert.ok(Math.abs(end[0]! - 44.72135955) < 0.0001)
})
test('preset adjustments change actual paths; compound paths keep fill/stroke', () => {
  const normal = shapeGeometry(xml('<prstGeom prst="roundRect"/>'), 200, 100)!
  const square = shapeGeometry(
    xml(
      '<prstGeom prst="roundRect"><avLst><gd name="adj" fmla="val 0"/></avLst></prstGeom>'
    ),
    200,
    100
  )!
  assert.notEqual(normal.paths[0]!.d, square.paths[0]!.d)
  const bevel = shapeGeometry(xml('<prstGeom prst="bevel"/>'), 200, 100)!
  assert.ok(bevel.paths.length > 1)
  assert.ok(bevel.paths.some((p) => p.fill === 'lighten'))
  assert.ok(bevel.paths.some((p) => !p.stroke))
})
test('unknown and malformed geometry never become a fake rectangle or nonfinite paths', () => {
  assert.equal(
    shapeGeometry(xml('<prstGeom prst="unknown"/>'), 200, 100),
    undefined
  )
  assert.equal(
    shapeGeometry(
      custom(
        '<gdLst><gd name="x" fmla="val missing"/></gdLst><pathLst><path><moveTo><pt x="x" y="0"/></moveTo></path></pathLst>'
      ),
      200,
      100
    ),
    undefined
  )
  assert.equal(
    shapeGeometry(xml('<prstGeom prst="rect"/>'), Infinity, 100),
    undefined
  )
})

const samplePresets = [
  'bentArrow',
  'bentUpArrow',
  'bevel',
  'can',
  'chevron',
  'chord',
  'corner',
  'cube',
  'curvedDownArrow',
  'curvedLeftArrow',
  'curvedRightArrow',
  'curvedUpArrow',
  'decagon',
  'diagStripe',
  'dodecagon',
  'donut',
  'downArrow',
  'ellipse',
  'frame',
  'halfFrame',
  'heptagon',
  'hexagon',
  'homePlate',
  'leftArrow',
  'leftArrowCallout',
  'leftRightArrow',
  'leftRightArrowCallout',
  'leftRightUpArrow',
  'leftUpArrow',
  'line',
  'noSmoking',
  'notchedRightArrow',
  'octagon',
  'parallelogram',
  'pentagon',
  'pie',
  'plus',
  'quadArrow',
  'quadArrowCallout',
  'rect',
  'rightArrow',
  'rightArrowCallout',
  'round1Rect',
  'round2DiagRect',
  'round2SameRect',
  'roundRect',
  'snip1Rect',
  'snip2DiagRect',
  'snip2SameRect',
  'snipRoundRect',
  'stripedRightArrow',
  'teardrop',
  'trapezoid',
  'triangle',
  'upArrow',
  'upArrowCallout',
  'upDownArrow',
  'uturnArrow',
]
for (const name of samplePresets)
  test(`sample preset ${name} has finite real paths`, () => {
    for (const [w, h] of [
      [200, 100],
      [100, 200],
      [100, 100],
    ]) {
      const g = shapeGeometry(xml(`<prstGeom prst="${name}"/>`), w!, h!)
      assert.ok(g && g.paths.length > 0, name)
      for (const p of g.paths) {
        assert.ok(p.d.length > 0)
        assert.doesNotMatch(p.d, /NaN|Infinity|undefined/)
      }
    }
  })
test('negative coordinate extents and excessive XML commands are rejected', () => {
  assert.equal(
    shapeGeometry(
      custom(
        '<pathLst><path w="-1" h="100"><moveTo><pt x="1" y="0"/></moveTo></path></pathLst>'
      ),
      200,
      100
    ),
    undefined
  )
  const commands = '<moveTo><pt x="0" y="0"/></moveTo>'.repeat(10001)
  assert.equal(
    shapeGeometry(
      custom(`<pathLst><path>${commands}</path></pathLst>`),
      200,
      100
    ),
    undefined
  )
})
test('all 187 standard definitions produce finite paths in three aspect ratios', async () => {
  const { presets } = await import('../src/drawing/presets')
  assert.equal(Object.keys(presets).length, 187)
  for (const name of Object.keys(presets))
    for (const [w, h] of [
      [200, 100],
      [100, 200],
      [100, 100],
    ]) {
      const g = shapeGeometry(xml(`<prstGeom prst="${name}"/>`), w!, h!)
      assert.ok(g, name)
      for (const p of g.paths) {
        assert.ok(p.d, name)
        assert.doesNotMatch(p.d, /NaN|Infinity|undefined/, name)
      }
    }
})
test('custom explicit path coordinates evaluate w/h guides within path extents', () => {
  const g = shapeGeometry(
    custom(
      '<gdLst><gd name="right" fmla="val w"/><gd name="bottom" fmla="val h"/></gdLst><pathLst><path w="100" h="50"><moveTo><pt x="0" y="0"/></moveTo><lnTo><pt x="right" y="bottom"/></lnTo></path></pathLst>'
    ),
    200,
    100
  )!
  assert.equal(g.paths[0]!.d, 'M 0 0 L 200 100')
})
test('custom omitted path extents use shape EMUs with CSS-pixel output', () => {
  const g = shapeGeometry(
    custom(
      '<pathLst><path><moveTo><pt x="0" y="0"/></moveTo><lnTo><pt x="952500" y="476250"/></lnTo></path></pathLst>'
    ),
    200,
    100
  )!
  assert.equal(g.paths[0]!.d, 'M 0 0 L 100 50')
})
