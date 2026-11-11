import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { VNode } from 'vue'
import { paintDefinition } from '../src/ui/paint.js'
import { shapeContent } from '../src/ui/shape.js'
import type { GradientPaint } from '../src/drawing/paint.js'
import type { SceneObject } from '../src/types.js'
const kids = (v: VNode) => v.children as VNode[]
const gradient: GradientPaint = {
  kind: 'gradient',
  stops: [
    { offset: 0, color: 'rgba(20,40,60,0.5)' },
    { offset: 1, color: 'rgba(100,120,140,0.5)' },
  ],
  focus: { left: 0.25, top: 0.25, right: 0.25, bottom: 0.25 },
  tile: { left: 0, top: 0, right: 0, bottom: 0 },
}
test('sample shape12 solidDmnd uses filled diamonds and pct5 has five percent foreground area', () => {
  const pattern = (preset: string) =>
    paintDefinition(
      { kind: 'pattern', preset, foreground: '#ffff00', background: '#000000' },
      'p'
    )
  const diamond = kids(pattern('solidDmnd'))[1]!
  assert.equal(diamond.type, 'path')
  assert.match(diamond.props!.d, /L4 8/)
  assert.equal(diamond.props!.fill, '#ffff00')
  const dot = kids(pattern('pct5'))[1]!
  assert.equal(dot.type, 'rect')
  assert.equal((dot.props!.width * dot.props!.height) / 64, 0.05)
})
test('compound gradient faces use separately shaded stops retaining alpha', () => {
  const shape = shapeContent({
    width: 100,
    height: 100,
    paint: gradient,
    paths: ['norm', 'lighten', 'darken'].map((fill) => ({
      d: 'M0 0',
      fill,
      stroke: false,
    })),
  } as SceneObject)
  const defs = kids(kids(shape)[0]!)
  assert.equal(defs.filter((v) => v?.type === 'linearGradient').length, 3)
  assert.deepEqual(
    defs.slice(0, 3).map((v) => kids(v)[0]!.props!['stop-color']),
    ['rgba(20,40,60,0.5)', 'rgba(114,126,138,0.5)', 'rgba(12,24,36,0.5)']
  )
  assert.equal(
    new Set(
      kids(shape)
        .slice(1)
        .map((v) => v.props!.fill)
    ).size,
    3
  )
})
test('compound rgba solid faces preserve alpha and 20 percent less shading', () => {
  const shape = shapeContent({
    width: 100,
    height: 100,
    fill: 'rgba(20,40,60,0.3)',
    paths: ['norm', 'lightenLess', 'darken'].map((fill) => ({
      d: 'M0 0',
      fill,
      stroke: false,
    })),
  } as SceneObject)
  assert.deepEqual(
    kids(shape)
      .slice(1)
      .map((v) => v.props!.fill),
    ['rgba(20,40,60,0.3)', 'rgba(67,83,99,0.3)', 'rgba(12,24,36,0.3)']
  )
})
for (const varying of [false, true])
  test(`rect gradient uses nonoverlapping evenodd rings with ${varying ? 'varying' : 'constant'} alpha`, () => {
    const paint = {
      ...gradient,
      path: 'rect',
      stops: [
        gradient.stops[0]!,
        { offset: 1, color: `rgba(100,120,140,${varying ? 0.9 : 0.5})` },
      ],
    }
    const nodes = kids(paintDefinition(paint, 'p'))
    assert.equal(nodes.length, 129)
    for (const node of nodes.slice(0, -1)) {
      assert.equal(node.type, 'path')
      assert.equal(node.props!['fill-rule'], 'evenodd')
      assert.equal((node.props!.d.match(/M/g) || []).length, 2)
    }
    assert.equal(nodes.at(-1)!.type, 'rect')
    const alphas = nodes.map((n) =>
      Number(n.props!.fill.match(/,([^,]+)\)$/)[1])
    )
    if (varying) {
      assert.ok(alphas[0]! > alphas.at(-1)!)
      assert.equal(alphas.at(-1), 0.5)
    } else assert.ok(alphas.every((a) => a === 0.5))
  })
test('pattern colors and image RGB transfer shade without changing alpha', () => {
  const pattern = paintDefinition(
    {
      kind: 'pattern',
      preset: 'solidDmnd',
      foreground: 'rgba(20,40,60,0.2)',
      background: 'rgba(100,120,140,0.7)',
    },
    'pattern',
    'lighten'
  )
  assert.equal(kids(pattern)[0]!.props!.fill, 'rgba(162,174,186,0.7)')
  assert.equal(kids(pattern)[1]!.props!.fill, 'rgba(114,126,138,0.2)')
  for (const mode of ['lighten', 'darkenLess']) {
    const image = paintDefinition(
      { kind: 'image', src: 'data:image/png;base64,AA==' },
      'image',
      mode
    )
    const filter = kids(image)[0]!,
      transfer = kids(filter)[0]!,
      channels = kids(transfer)
    assert.equal(filter.props!['color-interpolation-filters'], 'sRGB')
    assert.deepEqual(
      channels.map((c) => c.type),
      ['feFuncR', 'feFuncG', 'feFuncB']
    )
    assert.ok(
      channels.every(
        (c) =>
          c.props!.slope === (mode === 'lighten' ? 0.6 : 0.8) &&
          c.props!.intercept === (mode === 'lighten' ? 0.4 : 0)
      )
    )
    assert.equal(kids(image)[1]!.props!.filter, 'url(#image-shade)')
  }
})
test('rect gradient rings partition sampled pixels including center focus', () => {
  const nodes = kids(paintDefinition({ ...gradient, path: 'rect' }, 'p'))
  const contains = (node: VNode, x: number, y: number) => {
    const rect = (x0: number, y0: number, w: number, h: number) =>
      x >= x0 && x < x0 + w && y >= y0 && y < y0 + h
    if (node.type === 'rect') {
      const p = node.props!
      return rect(p.x, p.y, p.width, p.height)
    }
    const boxes = [
      ...node.props!.d.matchAll(
        /M([\d.e+-]+) ([\d.e+-]+) h([\d.e+-]+) v([\d.e+-]+)/g
      ),
    ].map((m) => m.slice(1).map(Number))
    return boxes.filter((b) => rect(b[0]!, b[1]!, b[2]!, b[3]!)).length === 1
  }
  for (const [x, y] of [
    [0.001, 0.17],
    [0.101, 0.31],
    [0.249, 0.6],
    [0.4, 0.4],
    [0.999, 0.2],
  ])
    assert.equal(nodes.filter((n) => contains(n, x!, y!)).length, 1)
})
