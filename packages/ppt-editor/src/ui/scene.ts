import { h, defineComponent, type PropType, type VNode } from 'vue'
import { AudioObject } from './AudioObject.js'
import { shapeContent } from './shape.js'
import { paintLayer } from './paint.js'
import { richTextContent, inlineTextContent } from './text.js'
import type { SceneObject, ScenePage, PresentationScene } from '../types.js'

export interface CanvasEditor {
  kind: 'table' | 'diagram' | 'text'
  row?: number
  column?: number
  nodeId?: string
  content: VNode
}
export function objectContent(
  object: SceneObject,
  thumbnail = false,
  editor?: CanvasEditor
): VNode {
  if (object.kind === 'diagram')
    return h(
      'div',
      {
        role: 'group',
        'aria-label': object.name,
        style: {
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        },
      },
      [
        h(
          'div',
          {
            class: 'ppt-diagram-coordinates',
            style: {
              position: 'absolute',
              width: `${object.childCoordinateSize?.width ?? object.width}px`,
              height: `${object.childCoordinateSize?.height ?? object.height}px`,
              transform: `scale(${object.childCoordinateSize?.width ? object.width / object.childCoordinateSize.width : 1}, ${object.childCoordinateSize?.height ? object.height / object.childCoordinateSize.height : 1})`,
              transformOrigin: '0 0',
            },
          },
          object.children?.map((child) =>
            h(
              'div',
              {
                key: child.id,
                'data-ppt-diagram-node': child.diagramNodeId,
                style: { position: 'absolute', ...objectPosition(child) },
              },
              [
                objectContent(
                  child,
                  thumbnail,
                  editor?.kind === 'diagram' &&
                    editor.nodeId === child.diagramNodeId
                    ? { ...editor, kind: 'text' }
                    : undefined
                ),
              ]
            )
          )
        ),
      ]
    )
  if (object.kind === 'media' && !thumbnail && object.mediaType === 'audio')
    return h(AudioObject, { object })
  if (object.kind === 'media' && !thumbnail)
    return h('video', {
      src: object.src,
      poster: object.poster,
      controls: true,
      autoplay: false,
      preload: 'none',
      'aria-label': object.name,
      onPointerdown: (e: Event) => e.stopPropagation(),
      onPointermove: (e: Event) => e.stopPropagation(),
      onPointerup: (e: Event) => e.stopPropagation(),
      onDblclick: (e: Event) => e.stopPropagation(),
      style: { width: '100%', height: '100%', objectFit: 'contain' },
    })
  if (object.kind === 'image' || object.kind === 'media') {
    const c = object.crop ?? { left: 0, right: 0, top: 0, bottom: 0 },
      w = 1 - c.left - c.right,
      hgt = 1 - c.top - c.bottom
    return h(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          pointerEvents: 'none',
        },
      },
      [
        h('img', {
          src: object.kind === 'media' ? object.poster : object.src,
          alt: object.name,
          draggable: false,
          style: {
            position: 'absolute',
            maxWidth: 'none',
            width: `${100 / w}%`,
            height: `${100 / hgt}%`,
            left: `${(-100 * c.left) / w}%`,
            top: `${(-100 * c.top) / hgt}%`,
            pointerEvents: 'none',
          },
        }),
      ]
    )
  }
  if (object.kind === 'table') {
    const widths = object.columnWidths ?? object.cells?.[0]?.map(() => 1) ?? []
    const heights = object.rowHeights ?? object.cells?.map(() => 1) ?? []
    const tracks = (values: number[]) => {
      const weights = values.map((value) =>
        Number.isFinite(value) && value > 0 ? value : 1
      )
      const largest =
        weights.reduce((max, value) => Math.max(max, value), 0) || 1
      // CSS fractional tracks totaling less than 1 leave unused space.
      return weights.map((value) => `minmax(0, ${value / largest}fr)`).join(' ')
    }
    return h(
      'div',
      {
        class: 'ppt-table',
        role: 'table',
        'aria-label': object.name,
        style: {
          gridTemplateColumns: tracks(widths),
          gridTemplateRows: tracks(heights),
        },
      },
      object.cells?.map((row, r) =>
        h(
          'div',
          { role: 'row', class: 'ppt-table-row' },
          row.map((cell, c) => {
            const meta = object.tableCells?.[r]?.[c]
            if (meta?.mergedInto) return null
            const margins = meta?.margins
            const shadows = Object.entries(meta?.borders ?? {})
              .map(([side, border]) => {
                const width = border!.width,
                  color = border!.color
                return `inset ${side === 'left' ? width : side === 'right' ? -width : 0}px ${side === 'top' ? width : side === 'bottom' ? -width : 0}px 0 ${color}`
              })
              .join(',')
            return h(
              'div',
              {
                role: 'cell',
                'data-ppt-row': r,
                'data-ppt-column': c,
                class: 'ppt-table-cell',
                'aria-colspan': meta?.columnSpan ?? 1,
                'aria-rowspan': meta?.rowSpan ?? 1,
                style: {
                  position: 'relative',
                  gridColumn: `${c + 1} / span ${meta?.columnSpan ?? 1}`,
                  gridRow: `${r + 1} / span ${meta?.rowSpan ?? 1}`,
                  background: meta?.fill,
                  color: meta?.style.color,
                  fontSize: meta?.style.fontSize
                    ? `${meta.style.fontSize}px`
                    : undefined,
                  fontWeight: meta?.style.bold ? 700 : 400,
                  fontStyle: meta?.style.italic ? 'italic' : 'normal',
                  textAlign: meta?.style.align,
                  fontFamily: meta?.style.fontFamily,
                  boxShadow: shadows || undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent:
                    meta?.verticalAlign === 'center'
                      ? 'center'
                      : meta?.verticalAlign === 'bottom'
                        ? 'flex-end'
                        : 'flex-start',
                },
              },
              h(
                'div',
                {
                  class: 'ppt-table-cell-content',
                  style: margins
                    ? {
                        padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
                      }
                    : undefined,
                },
                editor?.kind === 'table' &&
                  editor.row === r &&
                  editor.column === c
                  ? inlineTextContent(editor.content)
                  : cell
              )
            )
          })
        )
      )
    )
  }
  if (object.kind === 'unsupported')
    return h('div', { class: 'ppt-unsupported' }, [
      object.name,
      ' · 暂不支持预览',
    ])
  const isLine = object.geometry === 'line' && !object.paths
  return h(
    'div',
    {
      class: ['ppt-object-content', { 'ppt-object-line': isLine }],
      style: {
        position: 'relative',
        overflow: object.paths ? 'visible' : undefined,
        background:
          !object.paths && object.fill && object.fill !== 'none'
            ? object.fill
            : 'transparent',
        border:
          !object.paths && object.stroke && object.stroke !== 'none'
            ? `${object.strokeWidth ?? 1}px solid ${object.stroke}`
            : undefined,
        borderRadius:
          object.geometry === 'ellipse'
            ? '50%'
            : object.geometry === 'roundRect'
              ? '12px'
              : undefined,
        color: object.style?.color ?? '#17252b',
        fontSize: `${object.style?.fontSize ?? 24}px`,
        fontFamily:
          object.style?.fontFamily ??
          '"Noto Sans SC", "PingFang SC", sans-serif',
        fontWeight: object.style?.bold ? 700 : 400,
        fontStyle: object.style?.italic ? 'italic' : undefined,
        textDecoration: object.style?.underline ? 'underline' : undefined,
        textAlign: object.style?.align ?? 'left',
      },
    },
    [
      object.paths ? shapeContent(object) : null,
      h(
        'div',
        {
          style: {
            position: object.textRect ? 'absolute' : 'relative',
            left: object.textRect ? `${object.textRect.x}px` : undefined,
            top: object.textRect ? `${object.textRect.y}px` : undefined,
            width: object.textRect ? `${object.textRect.width}px` : '100%',
            height: object.textRect ? `${object.textRect.height}px` : '100%',
            overflow: 'hidden',
          },
        },
        object.richText
          ? richTextContent(
              object.richText,
              editor?.kind === 'text'
                ? inlineTextContent(editor.content)
                : undefined
            )
          : editor?.kind === 'text'
            ? inlineTextContent(editor.content)
            : (object.text ?? '')
      ),
    ]
  )
}
export const objectPosition = (object: SceneObject) => ({
  left: `${object.x}px`,
  top: `${object.y}px`,
  width: `${object.width}px`,
  height: `${object.height}px`,
  transform: `rotate(${object.rotation ?? 0}deg) scale(${object.flipH ? -1 : 1}, ${object.flipV ? -1 : 1})`,
})
export function preview(
  page: ScenePage,
  scene: Pick<PresentationScene, 'width' | 'height'>,
  width: number
): VNode {
  return h(
    'div',
    {
      class: 'ppt-miniature',
      style: {
        width: `${width}px`,
        height: `${(width * scene.height) / scene.width}px`,
      },
    },
    [
      h(
        'div',
        {
          class: 'ppt-slide',
          style: {
            width: `${scene.width}px`,
            height: `${scene.height}px`,
            background: page.background,
            transform: `scale(${width / scene.width})`,
            transformOrigin: '0 0',
          },
        },
        [
          paintLayer(page.backgroundPaint, scene.width, scene.height),
          ...page.objects.map((object) =>
            h(
              'div',
              {
                class: 'ppt-object',
                key: `${object.part}-${object.id}`,
                style: objectPosition(object),
              },
              [objectContent(object, true)]
            )
          ),
        ]
      ),
    ]
  )
}

// Stable child components keep selection, typing and drag feedback from rebuilding all SVGs.
export const SceneObjectView = defineComponent({
  props: {
    object: { type: Object as PropType<SceneObject>, required: true },
    editor: Object as PropType<CanvasEditor>,
  },
  setup: (props) => () => objectContent(props.object, false, props.editor),
})
export const SlidePreview = defineComponent({
  props: {
    page: { type: Object as PropType<ScenePage>, required: true },
    canvasWidth: { type: Number, required: true },
    canvasHeight: { type: Number, required: true },
    width: { type: Number, required: true },
  },
  setup: (props) => () =>
    preview(
      props.page,
      { width: props.canvasWidth, height: props.canvasHeight },
      props.width
    ),
})
