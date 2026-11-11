import { presets } from './presets.js'

type Attributes = Record<string, string>
type Command = [string, Attributes, Attributes[]]
type Definition = {
  av: string[][]
  gd: string[][]
  rect?: Attributes | null
  paths: { attrs: Attributes; commands: Command[] }[]
}
export interface ShapeGeometry {
  paths: { d: string; fill: string; stroke: boolean }[]
  textRect?: { x: number; y: number; width: number; height: number }
}
const ANGLE = Math.PI / 10800000
const MAX_ITEMS = 10000
const localName = (e: any): string =>
  e.localName ||
  String(e.nodeName || '')
    .split(':')
    .pop()
function children(e: any): any[] {
  const result: any[] = []
  for (let n = e?.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 1) result.push(n)
    if (result.length > MAX_ITEMS) throw new Error('Geometry limit')
  }
  return result
}
function attrs(e: any): Attributes {
  const result: Attributes = Object.create(null)
  for (let i = 0; i < (e?.attributes?.length || 0); i++) {
    if (i > 32) throw new Error('Attribute limit')
    const a = e.attributes.item(i)
    result[a.name] = a.value
  }
  return result
}
function readDefinition(element: any): Definition {
  let remaining = MAX_ITEMS * 2
  const boundedChildren = (node: any) => {
    const nodes = children(node)
    remaining -= nodes.length
    if (remaining < 0) throw new Error('Geometry XML limit')
    return nodes
  }
  const sections = boundedChildren(element)
  const section = (name: string) => sections.find((e) => localName(e) === name)
  const guides = (name: string) =>
    boundedChildren(section(name)).map((e) => [
      e.getAttribute('name'),
      e.getAttribute('fmla'),
    ])
  return {
    av: guides('avLst'),
    gd: guides('gdLst'),
    rect: section('rect') ? attrs(section('rect')) : undefined,
    paths: boundedChildren(section('pathLst')).map((p) => ({
      attrs: attrs(p),
      commands: boundedChildren(p).map(
        (c) =>
          [localName(c), attrs(c), boundedChildren(c).map(attrs)] as Command
      ),
    })),
  }
}
function checked(value: number): number {
  // Higher-order standard guides (e.g. circular-arrow discriminants) operate
  // on powers of EMU lengths, so their intermediates exceed output coordinates.
  if (!Number.isFinite(value) || Math.abs(value) > 1e100)
    throw new Error('Invalid geometry value')
  return value
}
const fmt = (v: number) => {
  if (Math.abs(v) > 1e12) throw new Error('Output coordinate limit')
  return String(Number(checked(v).toFixed(6)))
}
function context(width: number, height: number) {
  const values: Record<string, number> = Object.create(null)
  Object.assign(values, {
    w: width,
    h: height,
    l: 0,
    t: 0,
    r: width,
    b: height,
    hc: width / 2,
    vc: height / 2,
    ss: Math.min(width, height),
    ls: Math.max(width, height),
    cd: 21600000,
  })
  for (const d of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32]) {
    values[`wd${d}`] = width / d
    values[`hd${d}`] = height / d
    values[`ssd${d}`] = values.ss! / d
  }
  Object.assign(values, {
    cd2: 10800000,
    cd4: 5400000,
    cd8: 2700000,
    '3cd4': 16200000,
    '3cd8': 8100000,
    '5cd8': 13500000,
    '7cd8': 18900000,
  })
  const value = (token: string): number => {
    if (Object.hasOwn(values, token)) return values[token]!
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(token || ''))
      return checked(Number(token))
    throw new Error('Unknown geometry guide')
  }
  const formula = (expression: string): number => {
    if (!expression || expression.length > 256) throw new Error('Invalid guide')
    const [op, ...args] = expression.trim().split(/\s+/)
    const arities: Record<string, number> = {
      val: 1,
      abs: 1,
      sqrt: 1,
      '*/': 3,
      '+-': 3,
      '+/': 3,
      '?:': 3,
      at2: 2,
      sin: 2,
      cos: 2,
      tan: 2,
      cat2: 3,
      sat2: 3,
      pin: 3,
      mod: 3,
      min: 2,
      max: 2,
    }
    // POI/ECMA circular-arrow definitions contain redundant fourth operands;
    // as in POI, evaluate only the operands required by the operation.
    if (
      !Object.hasOwn(arities, op!) ||
      args.length < arities[op!]! ||
      args.length > 4
    )
      throw new Error('Invalid guide formula')
    const [x = 0, y = 0, z = 0] = args.slice(0, arities[op!]).map(value)
    let result: number
    switch (op) {
      case 'val':
        result = x
        break
      case 'abs':
        result = Math.abs(x)
        break
      case 'sqrt':
        result = Math.sqrt(Math.max(0, x))
        break
      case '*/':
        result = z === 0 ? 0 : (x * y) / z
        break
      case '+-':
        result = x + y - z
        break
      case '+/':
        result = z === 0 ? 0 : (x + y) / z
        break
      case '?:':
        result = x > 0 ? y : z
        break
      case 'at2':
        result = Math.atan2(y, x) / ANGLE
        break
      case 'sin':
        result = x * Math.sin(y * ANGLE)
        break
      case 'cos':
        result = x * Math.cos(y * ANGLE)
        break
      case 'tan':
        result = x * Math.tan(y * ANGLE)
        break
      case 'cat2':
        result = x * Math.cos(Math.atan2(z, y))
        break
      case 'sat2':
        result = x * Math.sin(Math.atan2(z, y))
        break
      case 'pin':
        result = Math.max(x, Math.min(y, z))
        break
      case 'mod':
        result = Math.hypot(x, y, z)
        break
      case 'min':
        result = Math.min(x, y)
        break
      case 'max':
        result = Math.max(x, y)
        break
      default:
        throw new Error('Unsupported formula')
    }
    return checked(result)
  }
  return { values, value, formula }
}
/** Evaluate DrawingML geometry into local CSS-pixel paths without mutating the source XML.
 * Unknown or invalid geometry returns undefined; never substitutes a rectangle.
 */
export function shapeGeometry(
  geometryElement: any,
  width: number,
  height: number
): ShapeGeometry | undefined {
  try {
    if (![width, height].every((v) => Number.isFinite(v) && v >= 0 && v <= 1e7))
      return undefined
    const name = localName(geometryElement)
    let definition: Definition
    let overrides: string[][] = []
    if (name === 'prstGeom') {
      const preset = geometryElement.getAttribute('prst')
      if (!Object.hasOwn(presets, preset)) return undefined
      definition = presets[preset] as Definition
      overrides = readDefinition(geometryElement).av
    } else if (name === 'custGeom') definition = readDefinition(geometryElement)
    else return undefined
    if (
      definition.av.length + definition.gd.length + overrides.length >
        MAX_ITEMS ||
      definition.paths.length > 256
    )
      return undefined
    const overrideMap = new Map(
      overrides.map(([key, formula]) => [key!, formula!])
    )
    const evaluatedContext = (w: number, h: number) => {
      const ctx = context(w, h)
      for (const [key, formula] of definition.av)
        ctx.values[key!] = ctx.formula(overrideMap.get(key!) ?? formula!)
      for (const [key, formula] of definition.gd)
        ctx.values[key!] = ctx.formula(formula!)
      return ctx
    }
    const emusPerPixel = 9525
    const shapeContext = evaluatedContext(
      width * emusPerPixel,
      height * emusPerPixel
    )
    let commandCount = 0
    const paths = definition.paths.map((path) => {
      const pw =
        path.attrs.w === undefined
          ? width * emusPerPixel
          : shapeContext.value(path.attrs.w)
      const ph =
        path.attrs.h === undefined
          ? height * emusPerPixel
          : shapeContext.value(path.attrs.h)
      if (pw < 0 || ph < 0) throw new Error('Negative path extent')
      const ctx = evaluatedContext(pw, ph)
      const sx = pw === 0 ? 0 : width / pw,
        sy = ph === 0 ? 0 : height / ph
      let x = 0,
        y = 0,
        startX = 0,
        startY = 0
      const output: string[] = []
      const point = (p: Attributes) =>
        [ctx.value(p.x!), ctx.value(p.y!)] as const
      const pair = (px: number, py: number) => `${fmt(px * sx)} ${fmt(py * sy)}`
      for (const [command, a, points] of path.commands) {
        if (++commandCount > MAX_ITEMS) throw new Error('Path limit')
        if (command === 'moveTo' || command === 'lnTo') {
          if (points.length !== 1) throw new Error('Invalid point count')
          ;[x, y] = point(points[0]!)
          output.push(`${command === 'moveTo' ? 'M' : 'L'} ${pair(x, y)}`)
          if (command === 'moveTo') {
            startX = x
            startY = y
          }
        } else if (command === 'quadBezTo' || command === 'cubicBezTo') {
          const count = command === 'quadBezTo' ? 2 : 3
          if (points.length !== count) throw new Error('Invalid bezier')
          const ps = points.map(point)
          output.push(
            `${count === 2 ? 'Q' : 'C'} ${ps.map((p) => pair(p[0], p[1])).join(' ')}`
          )
          ;[x, y] = ps[count - 1]!
        } else if (command === 'close') {
          output.push('Z')
          x = startX
          y = startY
        } else if (command === 'arcTo') {
          const rx = Math.abs(ctx.value(a.wR!)),
            ry = Math.abs(ctx.value(a.hR!))
          const start = ctx.value(a.stAng!) * ANGLE,
            sweep = ctx.value(a.swAng!) * ANGLE
          if (Math.abs(sweep) > Math.PI * 8) throw new Error('Arc limit')
          if (rx === 0 || ry === 0 || sweep === 0) continue
          // DrawingML angles describe rays from the ellipse center, not its
          // parametric angle. SVG endpoint arcs need the ray/ellipse intersection.
          const ellipse = (angle: number) => {
            const theta = Math.atan2(rx * Math.sin(angle), ry * Math.cos(angle))
            return [rx * Math.cos(theta), ry * Math.sin(theta)] as const
          }
          const first = ellipse(start),
            cx = x - first[0],
            cy = y - first[1]
          const steps = Math.ceil(Math.abs(sweep) / (Math.PI / 2))
          for (let i = 1; i <= steps; i++) {
            const p = ellipse(start + (sweep * i) / steps)
            x = cx + p[0]
            y = cy + p[1]
            output.push(
              `A ${fmt(rx * sx)} ${fmt(ry * sy)} 0 0 ${sweep > 0 ? 1 : 0} ${pair(x, y)}`
            )
          }
        } else throw new Error('Unsupported path command')
      }
      const fill = path.attrs.fill ?? 'norm'
      if (
        ![
          'none',
          'norm',
          'lighten',
          'lightenLess',
          'darken',
          'darkenLess',
        ].includes(fill)
      )
        throw new Error('Invalid path fill')
      return {
        d: output.join(' '),
        fill,
        stroke: !['0', 'false', 'off'].includes(path.attrs.stroke ?? '1'),
      }
    })
    if (!paths.length) return undefined
    const result: ShapeGeometry = { paths }
    if (definition.rect) {
      const rect = definition.rect,
        l = shapeContext.value(rect.l!) / emusPerPixel,
        t = shapeContext.value(rect.t!) / emusPerPixel,
        r = shapeContext.value(rect.r!) / emusPerPixel,
        b = shapeContext.value(rect.b!) / emusPerPixel
      result.textRect = {
        x: l,
        y: t,
        width: checked(r - l),
        height: checked(b - t),
      }
    }
    return result
  } catch {
    return undefined
  }
}
