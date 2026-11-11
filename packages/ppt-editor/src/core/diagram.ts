import type { SceneObject, TextStyle } from '../types.js'
import { shapeGeometry } from '../drawing/geometry.js'
import { readRichText } from '../drawing/text.js'
/** Cached SmartArt shape identity is modelId; cNvPr ids may all be zero. */
const DSP = 'http://schemas.microsoft.com/office/drawing/2008/diagram'
const children = (node: any, namespace: string, name: string): any[] =>
  Array.from(node?.childNodes ?? []).filter(
    (n: any) =>
      n.nodeType === 1 && n.namespaceURI === namespace && n.localName === name
  )
const child = (node: any, namespace: string, name: string) =>
  children(node, namespace, name)[0]
export function diagramNodes(
  data: any,
  drawing: any
): {
  modelId: string
  dataId?: string
  shape: any
  point?: any
}[] {
  const root = data.documentElement,
    ns = root.namespaceURI
  const points = children(child(root, ns, 'ptLst'), ns, 'pt')
  const pointMap = new Map<string, any>()
  for (const point of points) {
    const id = point.getAttribute('modelId')
    if (!id || pointMap.has(id)) throw Error('Duplicate diagram model identity')
    pointMap.set(id, point)
  }
  const seen = new Set<string>()
  return children(child(drawing.documentElement, DSP, 'spTree'), DSP, 'sp').map(
    (shape) => {
      const modelId = shape.getAttribute('modelId')
      if (!modelId || seen.has(modelId))
        throw Error('Duplicate diagram drawing identity')
      seen.add(modelId)
      const presentation = pointMap.get(modelId)
      const dataId =
        child(presentation, ns, 'prSet')?.getAttribute('presAssocID') ||
        undefined
      const point = dataId ? pointMap.get(dataId) : undefined
      return { modelId, dataId: point ? dataId : undefined, shape, point }
    }
  )
}

/** Convert the standard persisted DrawingML layout, retaining its model associations. */
export function readDiagramObjects(
  data: any,
  drawing: any,
  part: string,
  namespace: string,
  options: {
    color: (node: any) => string | undefined
    font: (name: string) => string | undefined
    readStyle: (runProperties: any, paragraphProperties: any) => TextStyle
  }
): SceneObject[] {
  const a = (node: any, name: string) => child(node, namespace, name)
  const unit = (node: any, name: string) =>
    Number(node?.getAttribute(name) || 0) / 9525
  return diagramNodes(data, drawing).map(({ modelId, dataId, shape }) => {
    const sp = child(shape, DSP, 'spPr'),
      xf = a(sp, 'xfrm')
    const off = a(xf, 'off'),
      ext = a(xf, 'ext')
    const body = child(shape, DSP, 'txBody'),
      style = child(shape, DSP, 'style')
    const baseStyle = {
      fontSize: 24,
      color: options.color(a(style, 'fontRef')),
      fontFamily: options.font(
        a(style, 'fontRef')?.getAttribute('idx') === 'major'
          ? '+mj-lt'
          : '+mn-lt'
      ),
    }
    const richText = body
      ? readRichText(body, namespace, {
          baseStyle: () => baseStyle,
          readStyle: (run, paragraph) =>
            options.readStyle(
              run ? a(run, 'rPr') : a(a(paragraph, 'pPr'), 'defRPr'),
              a(paragraph, 'pPr')
            ),
          font: options.font,
          color: (node) => options.color(node?.parentNode),
        })
      : undefined
    const object: SceneObject = {
      part,
      diagramNodeId: dataId,
      id: modelId,
      kind: body ? 'text' : 'shape',
      name: modelId,
      x: unit(off, 'x'),
      y: unit(off, 'y'),
      width: unit(ext, 'cx'),
      height: unit(ext, 'cy'),
      rotation: Number(xf?.getAttribute('rot') || 0) / 60000,
      flipH: ['1', 'true'].includes(xf?.getAttribute('flipH')),
      flipV: ['1', 'true'].includes(xf?.getAttribute('flipV')),
      geometry: a(sp, 'prstGeom')?.getAttribute('prst') || 'rect',
      fill: a(sp, 'noFill')
        ? 'none'
        : (options.color(a(sp, 'solidFill')) ??
          options.color(a(style, 'fillRef'))),
      stroke: a(a(sp, 'ln'), 'noFill')
        ? 'none'
        : (options.color(a(sp, 'ln')) ?? options.color(a(style, 'lnRef'))),
      strokeWidth: unit(a(sp, 'ln'), 'w') || 1,
      style: baseStyle,
      richText,
      text: richText?.paragraphs
        .map((p) => p.runs.map((r) => r.text).join(''))
        .join('\n'),
    }
    const geometry = a(sp, 'prstGeom') ?? a(sp, 'custGeom')
    const paths =
      geometry && shapeGeometry(geometry, object.width, object.height)
    object.paths = paths?.paths
    object.textRect = paths?.textRect
    const textTransform = child(shape, DSP, 'txXfrm')
    if (textTransform) {
      const textOff = a(textTransform, 'off'),
        textExt = a(textTransform, 'ext')
      object.textRect = {
        x: unit(textOff, 'x') - object.x,
        y: unit(textOff, 'y') - object.y,
        width: unit(textExt, 'cx'),
        height: unit(textExt, 'cy'),
      }
    }
    return object
  })
}
