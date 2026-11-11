import { h } from 'vue'
import type { DrawingPaint, GradientPaint } from '../drawing/paint.js'
let nextId = 0
function components(value: string): number[] {
  if (value.startsWith('#'))
    return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)).concat(1)
  const match = value.match(/[\d.]+/g)?.map(Number)
  return match?.length === 4
    ? match
    : match?.length === 3
      ? [...match, 1]
      : [0, 0, 0, 1]
}
export function shadeColor(color: string, mode: string) {
  if (mode === 'norm' || !/^lighten|^darken/.test(mode)) return color
  if (!/^#[\da-f]{6}$/i.test(color) && !/^rgba?\(/.test(color)) return color
  const rgba = components(color),
    amount = mode.endsWith('Less') ? 0.2 : 0.4
  const rgb = rgba
    .slice(0, 3)
    .map((c) =>
      Math.round(
        mode.startsWith('lighten') ? c + (255 - c) * amount : c * (1 - amount)
      )
    )
  return color.startsWith('#')
    ? '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('')
    : `rgba(${rgb.join(',')},${rgba[3]})`
}
function stopColor(paint: GradientPaint, position: number) {
  let right = paint.stops.findIndex((s) => s.offset >= position)
  if (right < 0) right = paint.stops.length - 1
  const after = paint.stops[right]!,
    before = paint.stops[Math.max(0, right - 1)]!
  const progress =
    after.offset === before.offset
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            (position - before.offset) / (after.offset - before.offset)
          )
        )
  const a = components(before.color),
    b = components(after.color)
  const rgba = a.map((v, i) => v + (b[i]! - v) * progress)
  return `rgba(${rgba.slice(0, 3).map(Math.round).join(',')},${rgba[3]})`
}
export function paintDefinition(
  paint: DrawingPaint,
  id: string,
  mode = 'norm'
) {
  if (mode !== 'norm' && paint.kind === 'gradient')
    paint = {
      ...paint,
      stops: paint.stops.map((s) => ({
        ...s,
        color: shadeColor(s.color, mode),
      })),
    }
  if (mode !== 'norm' && paint.kind === 'pattern')
    paint = {
      ...paint,
      foreground: shadeColor(paint.foreground, mode),
      background: shadeColor(paint.background, mode),
    }
  if (paint.kind === 'image') {
    const amount = mode.endsWith('Less') ? 0.2 : 0.4,
      light = mode.startsWith('lighten'),
      shaded = mode !== 'norm'
    return h(
      'pattern',
      { id, width: 1, height: 1, patternContentUnits: 'objectBoundingBox' },
      [
        shaded
          ? h(
              'filter',
              { id: `${id}-shade`, 'color-interpolation-filters': 'sRGB' },
              [
                h(
                  'feComponentTransfer',
                  {},
                  ['R', 'G', 'B'].map((c) =>
                    h(`feFunc${c}`, {
                      type: 'linear',
                      slope: 1 - amount,
                      intercept: light ? amount : 0,
                    })
                  )
                ),
              ]
            )
          : null,
        h('image', {
          href: paint.src,
          width: 1,
          height: 1,
          preserveAspectRatio: 'none',
          filter: shaded ? `url(#${id}-shade)` : undefined,
        }),
      ]
    )
  }
  if (paint.kind === 'pattern') {
    const diagonal = /diag/i.test(paint.preset),
      down = /dn|down/i.test(paint.preset)
    return h(
      'pattern',
      { id, width: 8, height: 8, patternUnits: 'userSpaceOnUse' },
      [
        h('rect', { width: 8, height: 8, fill: paint.background }),
        paint.preset === 'solidDmnd'
          ? h('path', { d: 'M4 0 L8 4 L4 8 L0 4 Z', fill: paint.foreground })
          : paint.preset === 'pct5'
            ? h('rect', {
                x: 1,
                y: 1,
                width: 2,
                height: 1.6,
                fill: paint.foreground,
              })
            : diagonal
              ? h('path', {
                  d: down
                    ? 'M-2 -2 L10 10 M-2 6 L2 10 M6 -2 L10 2'
                    : 'M-2 10 L10 -2 M-2 2 L2 -2 M6 10 L10 6',
                  stroke: paint.foreground,
                  'stroke-width': 1,
                })
              : h('circle', { cx: 2, cy: 2, r: 1, fill: paint.foreground }),
      ]
    )
  }
  const stops = paint.stops.map((s) =>
    h('stop', { offset: s.offset, 'stop-color': s.color })
  )
  if (!paint.path) {
    const angle = ((paint.angle ?? 0) * Math.PI) / 180,
      dx = Math.cos(angle),
      dy = Math.sin(angle),
      den = Math.abs(dx) + Math.abs(dy) || 1
    return h(
      'linearGradient',
      {
        id,
        x1: 0.5 - dx / den / 2,
        y1: 0.5 - dy / den / 2,
        x2: 0.5 + dx / den / 2,
        y2: 0.5 + dy / den / 2,
      },
      stops
    )
  }
  const { left, top, right, bottom } = paint.focus
  if (paint.path === 'rect') {
    const rectangle = (t: number) => {
      const x = left * t,
        y = top * t,
        w = Math.max(0, 1 - (left + right) * t),
        ht = Math.max(0, 1 - (top + bottom) * t)
      return { x, y, width: w, height: ht }
    }
    const outline = (t: number) => {
      const r = rectangle(t)
      return `M${r.x} ${r.y} h${r.width} v${r.height} h${-r.width} Z`
    }
    return h(
      'pattern',
      { id, width: 1, height: 1, patternContentUnits: 'objectBoundingBox' },
      Array.from({ length: 129 }, (_, i) => {
        const t = i / 128,
          fill = stopColor(paint, 1 - t)
        return i === 128
          ? h('rect', { ...rectangle(1), fill })
          : h('path', {
              d: outline(t) + ' ' + outline((i + 1) / 128),
              fill,
              'fill-rule': 'evenodd',
            })
      })
    )
  }
  const cx = (left + 1 - right) / 2,
    cy = (top + 1 - bottom) / 2
  const rx = Math.max(
      Math.abs(cx + paint.tile.left),
      Math.abs(1 - paint.tile.right - cx),
      0.001
    ),
    ry = Math.max(
      Math.abs(cy + paint.tile.top),
      Math.abs(1 - paint.tile.bottom - cy),
      0.001
    )
  return h(
    'radialGradient',
    {
      id,
      cx,
      cy,
      r: rx,
      gradientTransform: `translate(0 ${cy}) scale(1 ${ry / rx}) translate(0 ${-cy})`,
    },
    stops
  )
}
export function paintLayer(
  paint: DrawingPaint | undefined,
  width: number,
  height: number
) {
  if (!paint) return null
  const id = `ppt-paint-${++nextId}`
  return h(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      style: { position: 'absolute', inset: 0, pointerEvents: 'none' },
      'aria-hidden': true,
    },
    [
      h('defs', [paintDefinition(paint, id)]),
      h('rect', { width, height, fill: `url(#${id})` }),
    ]
  )
}
