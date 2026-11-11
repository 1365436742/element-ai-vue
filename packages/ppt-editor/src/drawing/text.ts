import type { TextStyle } from '../types.js'

export interface RichTextStyle extends TextStyle {
  baseline?: number
  strike?: boolean
  letterSpacing?: number
}
export interface RichTextRun {
  text: string
  break?: boolean
  style: RichTextStyle
}
export interface RichTextSpacing {
  unit: 'px' | 'percent'
  value: number
}
export interface RichTextBullet {
  text: string
  type: 'character' | 'number'
  fontFamily?: string
  color?: string
  size?: RichTextSpacing
}
export interface RichTextParagraph {
  level: number
  style: RichTextStyle
  runs: RichTextRun[]
  align: string
  marginLeft: number
  marginRight: number
  indent: number
  spaceBefore?: RichTextSpacing
  spaceAfter?: RichTextSpacing
  lineSpacing?: RichTextSpacing
  bullet?: RichTextBullet
  rtl: boolean
}
export interface RichTextScene {
  paragraphs: RichTextParagraph[]
  margins: { left: number; right: number; top: number; bottom: number }
  anchor: string
  wrap: boolean
  vertical: string
}
export interface RichTextOptions {
  baseStyle: (level: number) => TextStyle
  readStyle: (run: any, paragraph: any) => TextStyle
  font: (name: string) => string | undefined
  color: (node: any) => string | undefined
}
const MAX_START_NUMBER = 32767
const boundedNumber = (value: number) =>
  Number.isInteger(value) && value >= 1 && value <= MAX_START_NUMBER ? value : 1
const px = (value: string | number) => Number(value) / 9525
const attr = (node: any, name: string) =>
  node?.hasAttribute(name) ? (node.getAttribute(name) as string) : undefined

/** Pure read of DrawingML text; all lengths in returned scenes use CSS pixels. */
export function readRichText(
  body: any,
  namespace: string,
  options: RichTextOptions
): RichTextScene {
  const children = (node: any, name?: string): any[] =>
    Array.from(node?.childNodes ?? []).filter(
      (child: any) =>
        child.nodeType === 1 &&
        child.namespaceURI === namespace &&
        (!name || child.localName === name)
    )
  const child = (node: any, name: string) => children(node, name)[0]
  const style = (node: any): RichTextStyle => {
    const result: RichTextStyle = {}
    for (const [xml, key] of [
      ['b', 'bold'],
      ['i', 'italic'],
    ] as const)
      if (attr(node, xml) !== undefined)
        result[key] = ['1', 'true'].includes(attr(node, xml)!)
    if (attr(node, 'sz') !== undefined)
      result.fontSize = Number(attr(node, 'sz')) / 75
    if (attr(node, 'u') !== undefined)
      result.underline = attr(node, 'u') !== 'none'
    if (attr(node, 'strike') !== undefined)
      result.strike = attr(node, 'strike') !== 'noStrike'
    if (attr(node, 'baseline') !== undefined)
      result.baseline = Number(attr(node, 'baseline')) / 1000
    if (attr(node, 'spc') !== undefined)
      result.letterSpacing = Number(attr(node, 'spc')) / 75
    const face =
      attr(child(node, 'latin'), 'typeface') ||
      attr(child(node, 'ea'), 'typeface') ||
      attr(child(node, 'cs'), 'typeface')
    if (face) result.fontFamily = options.font(face) || face
    const fill = child(node, 'solidFill')
    if (fill) {
      const color = options.color(children(fill)[0])
      if (color) result.color = color
    }
    return result
  }
  const spacing = (node: any, name: string): RichTextSpacing | undefined => {
    const value = children(child(node, name))[0]
    if (!value) return undefined
    return {
      unit: value.localName === 'spcPct' ? 'percent' : 'px',
      value:
        Number(attr(value, 'val')) / (value.localName === 'spcPct' ? 1000 : 75),
    }
  }
  const bp = child(body, 'bodyPr')
  const list = child(body, 'lstStyle')
  const counters = new Map<number, { type: string; value: number }>()
  const paragraphs = children(body, 'p').map((paragraph): RichTextParagraph => {
    const pp = child(paragraph, 'pPr')
    const level = Number(attr(pp, 'lvl') || 0)
    const layers = [
      child(list, 'defPPr'),
      child(list, `lvl${level + 1}pPr`),
      pp,
    ].filter(Boolean)
    const get = (name: string) => {
      for (let i = layers.length - 1; i >= 0; i--) {
        const value = attr(layers[i], name)
        if (value !== undefined) return value
      }
      return undefined
    }
    // Each group is an XML choice: a nearer alternative clears inherited ones.
    const find = (...names: string[]) => {
      for (let i = layers.length - 1; i >= 0; i--) {
        const value = children(layers[i]).find((node) =>
          names.includes(node.localName)
        )
        if (value) return value
      }
      return undefined
    }
    const inherited = Object.assign(
      {},
      options.baseStyle(level),
      ...layers.map((layer) => style(child(layer, 'defRPr')))
    ) as RichTextStyle
    const directStyle = options.readStyle(undefined, paragraph)
    const paragraphStyle = { ...inherited, ...directStyle }
    const runs = children(paragraph)
      .filter((n) => ['r', 'fld', 'br'].includes(n.localName))
      .map(
        (run): RichTextRun => ({
          text:
            run.localName === 'br' ? '\n' : child(run, 't')?.textContent || '',
          ...(run.localName === 'br' ? { break: true } : {}),
          style: {
            ...paragraphStyle,
            ...options.readStyle(run, paragraph),
            ...style(child(run, 'rPr')),
          },
        })
      )
    let bullet: RichTextBullet | undefined
    let bulletNode: any
    for (let i = layers.length - 1; i >= 0 && !bulletNode; i--)
      bulletNode = children(layers[i]).find((n) =>
        ['buNone', 'buChar', 'buAutoNum'].includes(n.localName)
      )
    if (bulletNode?.localName === 'buAutoNum') {
      const type = attr(bulletNode, 'type') || 'arabicPeriod'
      const previous = counters.get(level)
      const start = attr(bulletNode, 'startAt')
      const value =
        start !== undefined
          ? boundedNumber(Number(start))
          : previous?.type === type
            ? Math.min(previous.value + 1, MAX_START_NUMBER)
            : 1
      counters.set(level, { type, value })
      for (const key of counters.keys()) if (key > level) counters.delete(key)
      bullet = { type: 'number', text: numberText(value, type) }
    } else {
      counters.delete(level)
      if (bulletNode?.localName === 'buChar')
        bullet = { type: 'character', text: attr(bulletNode, 'char') || '•' }
    }
    if (bullet) {
      const textStyle = runs.find((run) => !run.break)?.style || paragraphStyle
      const fontNode = find('buFont', 'buFontTx')
      const face = attr(fontNode, 'typeface')
      if (fontNode?.localName === 'buFontTx')
        bullet.fontFamily = textStyle.fontFamily
      else if (face) bullet.fontFamily = options.font(face) || face
      const colorNode = find('buClr', 'buClrTx')
      if (colorNode?.localName === 'buClrTx') bullet.color = textStyle.color
      else if (colorNode) bullet.color = options.color(children(colorNode)[0])
      const sizeNode = find('buSzPct', 'buSzPts', 'buSzTx')
      if (sizeNode?.localName === 'buSzTx') {
        if (textStyle.fontSize !== undefined)
          bullet.size = { unit: 'px', value: textStyle.fontSize }
      } else if (sizeNode)
        bullet.size = {
          unit: sizeNode.localName === 'buSzPct' ? 'percent' : 'px',
          value:
            Number(attr(sizeNode, 'val')) /
            (sizeNode.localName === 'buSzPct' ? 1000 : 75),
        }
    }
    const mergedSpacing = (name: string) => {
      for (let i = layers.length - 1; i >= 0; i--) {
        const value = spacing(layers[i], name)
        if (value) return value
      }
      return undefined
    }
    return {
      level,
      style: paragraphStyle,
      runs,
      align: get('algn') || paragraphStyle.align || 'l',
      marginLeft: px(get('marL') || 0),
      marginRight: px(get('marR') || 0),
      indent: px(get('indent') || 0),
      spaceBefore: mergedSpacing('spcBef'),
      spaceAfter: mergedSpacing('spcAft'),
      lineSpacing: mergedSpacing('lnSpc'),
      bullet,
      rtl: ['1', 'true'].includes(get('rtl') || ''),
    }
  })
  return {
    paragraphs,
    margins: {
      left: px(attr(bp, 'lIns') ?? 91440),
      right: px(attr(bp, 'rIns') ?? 91440),
      top: px(attr(bp, 'tIns') ?? 45720),
      bottom: px(attr(bp, 'bIns') ?? 45720),
    },
    anchor: attr(bp, 'anchor') || 't',
    wrap: attr(bp, 'wrap') !== 'none',
    vertical: attr(bp, 'vert') || 'horz',
  }
}
function numberText(input: number, type: string): string {
  // Independent guard keeps formatter work bounded even if a future caller bypasses parsing.
  const n = boundedNumber(input)
  let value = String(n)
  if (type.startsWith('alpha')) {
    value = ''
    let remainder = n
    for (let digit = 0; digit < 4 && remainder > 0; digit++) {
      remainder--
      value = String.fromCharCode(97 + (remainder % 26)) + value
      remainder = Math.floor(remainder / 26)
    }
    if (type.startsWith('alphaUc')) value = value.toUpperCase()
  } else if (type.startsWith('roman')) {
    value = ''
    let remainder = n
    for (const [amount, symbol] of [
      [1000, 'M'],
      [900, 'CM'],
      [500, 'D'],
      [400, 'CD'],
      [100, 'C'],
      [90, 'XC'],
      [50, 'L'],
      [40, 'XL'],
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ] as const) {
      const count = Math.floor(remainder / amount)
      value += symbol.repeat(count)
      remainder %= amount
    }
    if (type.startsWith('romanLc')) value = value.toLowerCase()
  } else if (type.startsWith('circleNum'))
    return n >= 1 && n <= 20 ? String.fromCodePoint(0x2460 + n - 1) : `(${n})`
  else if (type.startsWith('ea1JpnChs')) {
    const digits = '〇一二三四五六七八九'
    value =
      n < 10
        ? digits[n]
        : n < 100
          ? `${n < 20 ? '' : digits[Math.floor(n / 10)]}十${n % 10 ? digits[n % 10] : ''}`
          : String(n)
  }
  if (type.endsWith('ParenBoth')) return `(${value})`
  if (type.endsWith('ParenR')) return `${value})`
  return type.endsWith('Period') ? `${value}.` : value
}
