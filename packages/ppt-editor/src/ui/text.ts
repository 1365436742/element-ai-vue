import { h, type CSSProperties, type VNode } from 'vue'
import type {
  RichTextScene,
  RichTextStyle,
  RichTextSpacing,
} from '../drawing/text.js'
const length = (spacing?: RichTextSpacing) =>
  spacing ? `${spacing.value}${spacing.unit === 'px' ? 'px' : '%'}` : undefined
const css = (style: RichTextStyle): CSSProperties => ({
  fontFamily: style.fontFamily,
  fontSize: style.fontSize === undefined ? undefined : `${style.fontSize}px`,
  color: style.color,
  fontWeight: style.bold ? 'bold' : 'normal',
  fontStyle: style.italic ? 'italic' : 'normal',
  textDecoration:
    [style.underline ? 'underline' : '', style.strike ? 'line-through' : '']
      .filter(Boolean)
      .join(' ') || 'none',
  verticalAlign: style.baseline ? `${style.baseline}%` : undefined,
  letterSpacing:
    style.letterSpacing === undefined ? undefined : `${style.letterSpacing}px`,
})
/** Native text nodes preserve XML whitespace and cannot inject markup. */
export function richTextContent(scene: RichTextScene, editor?: VNode): VNode {
  const vertical = scene.vertical !== 'horz'
  const writingMode =
    scene.vertical === 'vert270'
      ? 'sideways-lr'
      : vertical
        ? 'vertical-rl'
        : 'horizontal-tb'
  return h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        padding: `${scene.margins.top}px ${scene.margins.right}px ${scene.margins.bottom}px ${scene.margins.left}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent:
          (
            {
              ctr: 'center',
              b: 'flex-end',
              just: 'space-between',
              dist: 'space-around',
            } as Record<string, string>
          )[scene.anchor] || 'flex-start',
        writingMode,
        textOrientation: scene.vertical === 'eaVert' ? 'upright' : 'mixed',
      },
    },
    scene.paragraphs.map((paragraph, index) => {
      if (editor && index > 0) return null
      const fontSize = paragraph.runs.reduce(
        (maximum, run) =>
          Math.max(
            maximum,
            run.style.fontSize ?? paragraph.style.fontSize ?? 16
          ),
        paragraph.runs.length ? 0 : (paragraph.style.fontSize ?? 16)
      )
      const paragraphSpace = (spacing?: RichTextSpacing) =>
        spacing
          ? `${spacing.unit === 'percent' ? (spacing.value * fontSize) / 100 : spacing.value}px`
          : '0'
      const style: CSSProperties = {
        ...css(paragraph.style),
        flexShrink: 0,
        margin: 0,
        marginBlockStart: paragraphSpace(paragraph.spaceBefore),
        marginBlockEnd: paragraphSpace(paragraph.spaceAfter),
        marginInlineStart: `${paragraph.marginLeft}px`,
        marginInlineEnd: `${paragraph.marginRight}px`,
        textAlign:
          (
            {
              l: 'left',
              r: 'right',
              ctr: 'center',
              just: 'justify',
              dist: 'justify',
            } as Record<string, CSSProperties['textAlign']>
          )[paragraph.align] || (paragraph.align as CSSProperties['textAlign']),
        lineHeight:
          paragraph.lineSpacing?.unit === 'percent'
            ? String(paragraph.lineSpacing.value / 100)
            : length(paragraph.lineSpacing) || 'normal',
        whiteSpace: scene.wrap ? 'pre-wrap' : 'pre',
        overflowWrap: scene.wrap ? 'break-word' : 'normal',
        direction: paragraph.rtl ? 'rtl' : 'ltr',
        position: 'relative',
        minHeight: vertical ? undefined : '1em',
        minWidth: vertical ? '1em' : undefined,
        textIndent: paragraph.bullet ? undefined : `${paragraph.indent}px`,
      }
      if (editor)
        return h(
          'div',
          {
            style: {
              ...style,
              ...css(paragraph.runs[0]?.style ?? paragraph.style),
            },
          },
          [editor]
        )
      const content = paragraph.runs.map((run) =>
        run.break ? h('br') : h('span', { style: css(run.style) }, run.text)
      )
      if (!content.length) content.push(h('br'))
      if (paragraph.bullet)
        content.unshift(
          h(
            'span',
            {
              'aria-hidden': 'true',
              style: {
                position: 'absolute',
                insetInlineStart: `${paragraph.indent}px`,
                transform:
                  paragraph.indent < 0 ? undefined : 'translateX(-100%)',
                fontFamily: paragraph.bullet.fontFamily,
                color: paragraph.bullet.color,
                fontSize: length(paragraph.bullet.size),
                whiteSpace: 'pre',
              },
            },
            paragraph.bullet.text
          )
        )
      return h('p', { style }, content)
    })
  )
}

/** Let the editor occupy the same flowing line box as displayed text.
 * The hidden mirror grows with wrapping/newlines; the textarea adds no padding
 * or borders to that measurement, so flex centering and cell margins survive.
 */
export function inlineTextContent(input: VNode): VNode {
  return h('div', { class: 'ppt-inline-text-flow' }, [
    h(
      'div',
      { class: 'ppt-inline-text-measure', 'aria-hidden': 'true' },
      `${input.props?.value ?? ''}\u200b`
    ),
    input,
  ])
}
