import { h } from 'vue'
import { paintDefinition, shadeColor } from './paint.js'
import type { SceneObject } from '../types.js'
let nextId = 0
export function shapeContent(object: SceneObject) {
  const id = `ppt-shape-${++nextId}`,
    stroke = object.stroke ?? 'none',
    width = object.strokeWidth ?? 1
  const marker = (type: string | undefined, side: string) => {
    if (!type || type === 'none') return null
    const path =
      type === 'diamond'
        ? 'M0 3 L3 0 L6 3 L3 6 Z'
        : type === 'arrow'
          ? 'M0 0 L6 3 L0 6'
          : type === 'stealth'
            ? 'M0 0 L6 3 L0 6 L2 3 Z'
            : 'M0 0 L6 3 L0 6 Z'
    return h(
      'marker',
      {
        id: `${id}-${side}`,
        viewBox: '0 0 6 6',
        markerWidth: 6,
        markerHeight: 6,
        refX: 6,
        refY: 3,
        orient: 'auto-start-reverse',
        markerUnits: 'strokeWidth',
      },
      [
        type === 'oval'
          ? h('ellipse', { cx: 3, cy: 3, rx: 3, ry: 3, fill: stroke })
          : h('path', {
              d: path,
              fill: type === 'arrow' ? 'none' : stroke,
              stroke,
              strokeWidth: type === 'arrow' ? 1 : 0,
            }),
      ]
    )
  }
  const dash = (
    {
      dash: [4, 3],
      dot: [1, 3],
      sysDash: [3, 1],
      sysDot: [1, 1],
      dashDot: [4, 3, 1, 3],
      lgDash: [8, 3],
      lgDashDot: [8, 3, 1, 3],
      lgDashDotDot: [8, 3, 1, 3, 1, 3],
      sysDashDot: [3, 1, 1, 1],
      sysDashDotDot: [3, 1, 1, 1, 1, 1],
    } as Record<string, number[]>
  )[object.strokeDash ?? '']
  return h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: Math.max(object.width, 1),
      height: Math.max(object.height, 1),
      viewBox: `0 0 ${Math.max(object.width, 1)} ${Math.max(object.height, 1)}`,
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        overflow: 'visible',
        pointerEvents: 'none',
      },
      'aria-hidden': 'true',
    },
    [
      h('defs', [
        ...(object.paint
          ? [
              ...new Set(
                object
                  .paths!.map((path) => path.fill)
                  .filter((mode) => mode !== 'none')
              ),
            ].map((mode) =>
              paintDefinition(object.paint!, `${id}-fill-${mode}`, mode)
            )
          : []),
        marker(object.headEnd, 'head'),
        marker(object.tailEnd, 'tail'),
      ]),
      ...object.paths!.map((path) =>
        h('path', {
          d: path.d,
          fill:
            path.fill === 'none'
              ? 'none'
              : object.paint
                ? `url(#${id}-fill-${path.fill})`
                : shadeColor(object.fill ?? 'none', path.fill),
          stroke: path.stroke ? stroke : 'none',
          'stroke-width': width,
          'stroke-dasharray': dash?.map((n) => n * width).join(' '),
          'stroke-linejoin': 'round',
          'marker-start':
            object.headEnd && object.headEnd !== 'none'
              ? `url(#${id}-head)`
              : undefined,
          'marker-end':
            object.tailEnd && object.tailEnd !== 'none'
              ? `url(#${id}-tail)`
              : undefined,
        })
      ),
    ]
  )
}
