import { validateCommand, validateAsset } from './validate.js'
import { readTableCells } from './table-scene.js'
import { diagramNodes, readDiagramObjects } from './diagram.js'
import { applyColorTransforms } from './color.js'
import { shapeGeometry } from '../drawing/geometry.js'
import type { DrawingPaint } from '../drawing/paint.js'
import { readRichText } from '../drawing/text.js'
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import type {
  Command,
  CommandResult,
  PresentationScene,
  ScenePage,
  SceneObject,
  TextStyle,
} from '../types.js'
const P = 'http://schemas.openxmlformats.org/presentationml/2006/main',
  A = 'http://schemas.openxmlformats.org/drawingml/2006/main',
  R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  PKG = 'http://schemas.openxmlformats.org/package/2006/relationships'
const E = 9525
const assetUrls = new WeakMap<Uint8Array, string>()
const xml = (s: string) =>
  new DOMParser({
    errorHandler: {
      warning: (m) => {
        throw Error(m)
      },
      error: (m) => {
        throw Error(m)
      },
      fatalError: (m) => {
        throw Error(m)
      },
    },
  }).parseFromString(s, 'application/xml')
const ser = (n: any) => new XMLSerializer().serializeToString(n)
const all = (n: any, name: string): any[] =>
  Array.from(n.getElementsByTagName('*')).filter(
    (e: any) => e.localName === name
  )
const first = (n: any, name: string) => all(n, name)[0]
const kids = (n: any): any[] =>
  Array.from(n.childNodes || []).filter((e: any) => e.nodeType === 1)
const fillChoices = [
  'noFill',
  'solidFill',
  'gradFill',
  'blipFill',
  'pattFill',
  'grpFill',
]
const child = (n: any, name: string, ns: string) =>
  n && kids(n).find((v) => v.localName === name && v.namespaceURI === ns)
const blankTableCellBody =
  '<a:txBody><a:bodyPr/><a:lstStyle/><a:p/></a:txBody><a:tcPr/>'
const blankTableCell = `<a:tc>${blankTableCellBody}</a:tc>`
const isMergedTableCell = (cell: any) =>
  ['rowSpan', 'gridSpan'].some((name) => Number(cell.getAttribute(name)) > 1) ||
  ['hMerge', 'vMerge'].some((name) =>
    ['1', 'true'].includes(cell.getAttribute(name).trim())
  )
function requireTableExtent(node: any, attribute: string) {
  const value = node?.getAttribute(attribute)?.trim()
  const extent = Number(value)
  if (
    !/^\+?\d+$/.test(value ?? '') ||
    !Number.isSafeInteger(extent) ||
    extent <= 0
  )
    throw Error('Invalid table extent')
  return extent
}
const descendants = (n: any, name: string, ns: string): any[] =>
  n ? all(n, name).filter((v) => v.namespaceURI === ns) : []
function orderedChild(
  parent: any,
  node: any,
  order: readonly string[],
  ns: string
) {
  const index = order.indexOf(node.localName)
  parent.insertBefore(
    node,
    kids(parent).find(
      (v) => v.namespaceURI === ns && order.indexOf(v.localName) > index
    ) ?? null
  )
}
const runOrder = [
  'ln',
  ...fillChoices,
  'effectLst',
  'effectDag',
  'highlight',
  'uLnTx',
  'uLn',
  'uFillTx',
  'uFill',
  'latin',
  'ea',
  'cs',
  'sym',
  'hlinkClick',
  'hlinkMouseOver',
  'rtl',
  'extLst',
]
const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
function path(base: string, target: string) {
  if (
    target.includes('\\') ||
    target.includes('\0') ||
    /%(?:2e|2f|5c|00)/i.test(target) ||
    target.includes('?') ||
    target.includes('#') ||
    /^[a-z]+:/i.test(target) ||
    target.startsWith('/')
  )
    throw Error('Invalid relationship target path')
  const parts = base.split('/').slice(0, -1)
  for (const s of target.split('/')) {
    if (s === '..') {
      if (!parts.length) throw Error('Relationship target path escapes package')
      parts.pop()
    } else if (s && s !== '.') parts.push(s)
  }
  return parts.join('/')
}
const relpath = (p: string) =>
  p
    .split('/')
    .slice(0, -1)
    .concat('_rels', p.split('/').at(-1) + '.rels')
    .join('/')
const wrap = (root: string, body: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><p:${root} xmlns:p="${P}" xmlns:a="${A}" xmlns:r="${R}">${body}</p:${root}>`
const tree =
  '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree>'
export class OfficeDocument {
  private presentation = 'ppt/presentation.xml'
  private strict = false
  private get P() {
    return this.strict ? 'http://purl.oclc.org/ooxml/presentationml/main' : P
  }
  private get A() {
    return this.strict ? 'http://purl.oclc.org/ooxml/drawingml/main' : A
  }
  private get tableUri() {
    return this.A.replace(/main$/, 'table')
  }
  private get R() {
    return this.strict
      ? 'http://purl.oclc.org/ooxml/officeDocument/relationships'
      : R
  }
  private wrap(root: string, body: string) {
    return wrap(root, body)
      .replaceAll(P, this.P)
      .replaceAll(A, this.A)
      .replaceAll(R, this.R)
  }
  private parts: Record<string, Uint8Array> = {}
  private docs = new Map<string, any>()
  private dirty = new Set<string>()
  private touched = new Set<string>()
  private pageCache = new Map<
    string,
    { page: ScenePage; diagnostics: PresentationScene['diagnostics'] }
  >()
  private invalidatePart(part: string) {
    this.touched.add(part)
    // A slide XML only affects its own projection. All other package changes
    // conservatively invalidate inheritance, relationship and resource consumers.
    if (this.docs.get(part)?.documentElement.localName === 'sld') {
      this.pageCache.delete(part + ':true')
      this.pageCache.delete(part + ':false')
    } else this.pageCache.clear()
  }
  static create(title = 'Untitled'): OfficeDocument {
    const d = new OfficeDocument()
    d.put(
      '[Content_Types].xml',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/></Types>'
    )
    d.put(
      '_rels/.rels',
      `<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`
    )
    d.put(
      'docProps/core.xml',
      `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(title)}</dc:title></cp:coreProperties>`
    )
    d.put(
      'ppt/presentation.xml',
      wrap(
        'presentation',
        '<p:sldMasterIdLst/><p:sldIdLst/><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/>'
      )
    )
    d.content('ppt/presentation.xml', 'presentation.main')
    d.content('docProps/core.xml', 'core-properties')
    d.put(
      'ppt/theme/theme1.xml',
      `<a:theme xmlns:a="${A}" name="Office"><a:themeElements><a:clrScheme name="Office">${Object.entries(
        {
          dk1: '000000',
          lt1: 'FFFFFF',
          dk2: '44546A',
          lt2: 'E7E6E6',
          accent1: '4472C4',
          accent2: 'ED7D31',
          accent3: 'A5A5A5',
          accent4: 'FFC000',
          accent5: '5B9BD5',
          accent6: '70AD47',
          hlink: '0563C1',
          folHlink: '954F72',
        }
      )
        .map(([k, v]) => `<a:${k}><a:srgbClr val="${v}"/></a:${k}>`)
        .join(
          ''
        )}</a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/><a:headEnd type="none" w="med" len="med"/><a:tailEnd type="none" w="med" len="med"/></a:ln><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/><a:headEnd type="none" w="med" len="med"/><a:tailEnd type="none" w="med" len="med"/></a:ln><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/><a:headEnd type="none" w="med" len="med"/><a:tailEnd type="none" w="med" len="med"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`
    )
    d.content('ppt/theme/theme1.xml', 'theme')
    const m = d.execute({ type: 'master.add' }).part!
    const l = d.execute({ type: 'layout.add', masterPart: m }).part!
    d.execute({ type: 'slide.add', layoutPart: l })
    return d
  }
  static load(bytes: Uint8Array) {
    if (bytes.length > 100 * 1024 * 1024)
      throw Error('ZIP compressed budget exceeded')
    let total = 0
    const parts = unzipSync(bytes, {
      filter: (f) => {
        total += f.originalSize
        if (total > 256 * 1024 * 1024 || f.originalSize > 64 * 1024 * 1024)
          throw Error('ZIP expansion budget exceeded')
        if (
          f.name.startsWith('/') ||
          f.name.split('/').includes('..') ||
          f.name.includes('\\')
        )
          throw Error('Invalid ZIP path')
        return true
      },
    })
    const d = new OfficeDocument()
    d.parts = parts
    if (!parts['[Content_Types].xml'] || !parts['_rels/.rels'])
      throw Error('Not a supported PPTX package')
    const root = all(d.doc('_rels/.rels'), 'Relationship').find(
      (r) =>
        r.getAttribute('Type').endsWith('/officeDocument') &&
        r.getAttribute('TargetMode') !== 'External'
    )
    if (!root) throw Error('Missing officeDocument relationship')
    d.presentation = path('', root.getAttribute('Target'))
    const ns = d.doc(d.presentation).documentElement.namespaceURI
    if (ns !== P && ns !== 'http://purl.oclc.org/ooxml/presentationml/main')
      throw Error('Not a presentation document')
    d.strict = ns !== P
    for (const p of Object.keys(parts))
      if (p.endsWith('.rels'))
        for (const r of all(d.doc(p), 'Relationship'))
          if (r.getAttribute('TargetMode') !== 'External')
            path(
              p.replace(/_rels\//, '').replace(/\.rels$/, ''),
              r.getAttribute('Target')
            )
    d.getScene()
    return d
  }
  private doc(p: string) {
    if (!this.parts[p]) throw Error(`Missing part ${p}`)
    if (!this.docs.has(p)) {
      const s = strFromU8(this.parts[p]!)
      if (/<!DOCTYPE|<!ENTITY/i.test(s)) throw Error('DTD is forbidden')
      this.docs.set(p, xml(s))
    }
    return this.docs.get(p)
  }
  private put(p: string, s: string) {
    this.invalidatePart(p)
    this.parts[p] = strToU8(s)
    this.docs.delete(p)
    this.dirty.delete(p)
  }
  private edit(p: string) {
    const d = this.doc(p)
    this.invalidatePart(p)
    this.dirty.add(p)
    return d
  }
  private content(p: string, type: string) {
    const d = this.edit('[Content_Types].xml')
    if (all(d, 'Override').some((n) => n.getAttribute('PartName') === '/' + p))
      return
    const n = d.createElementNS(d.documentElement.namespaceURI, 'Override')
    n.setAttribute('PartName', '/' + p)
    n.setAttribute(
      'ContentType',
      type === 'core-properties'
        ? 'application/vnd.openxmlformats-package.core-properties+xml'
        : type === 'theme'
          ? 'application/vnd.openxmlformats-officedocument.theme+xml'
          : `application/vnd.openxmlformats-officedocument.presentationml.${type}+xml`
    )
    d.documentElement.appendChild(n)
  }
  private relations(p: string) {
    const rp = relpath(p)
    if (!this.parts[rp]) return []
    return all(this.doc(rp), 'Relationship')
  }
  private relatedParts(p: string, type: string): string[] {
    return this.relations(p)
      .filter(
        (r) =>
          r.getAttribute('TargetMode') !== 'External' &&
          r.getAttribute('Type').endsWith('/' + type)
      )
      .map((r) => path(p, r.getAttribute('Target')))
  }
  private related(p: string, type: string) {
    const n = this.relations(p).find((r) =>
      r.getAttribute('Type').endsWith('/' + type)
    )
    return n ? path(p, n.getAttribute('Target')) : undefined
  }
  private relation(p: string, target: string, type: string) {
    const rp = relpath(p)
    if (!this.parts[rp]) this.put(rp, `<Relationships xmlns="${PKG}"/>`)
    const d = this.edit(rp)
    const ids = new Set(all(d, 'Relationship').map((r) => r.getAttribute('Id')))
    let i = 1
    while (ids.has('rId' + i)) i++
    const r = d.createElementNS(PKG, 'Relationship')
    r.setAttribute('Id', 'rId' + i)
    r.setAttribute('Type', this.R + '/' + type)
    const from = p.split('/').slice(0, -1),
      to = target.split('/')
    while (from[0] === to[0]) {
      from.shift()
      to.shift()
    }
    r.setAttribute('Target', '../'.repeat(from.length) + to.join('/'))
    d.documentElement.appendChild(r)
    return 'rId' + i
  }
  private next(folder: string, prefix: string) {
    let i = 1
    while (this.parts[`ppt/${folder}/${prefix}${i}.xml`]) i++
    return `ppt/${folder}/${prefix}${i}.xml`
  }
  private ordered() {
    const d = this.doc(this.presentation)
    return all(d, 'sldId').map((n) => {
      const r = this.relations(this.presentation).find(
        (r) =>
          r.getAttribute('Id') ===
          (n.getAttributeNS(this.R, 'id') || n.getAttribute('r:id'))
      )
      if (!r) throw Error('Missing slide relationship')
      return path(this.presentation, r.getAttribute('Target'))
    })
  }
  private themePart(
    part: string,
    seen = new Set<string>()
  ): string | undefined {
    if (seen.has(part)) throw new Error('Cyclic theme inheritance')
    seen.add(part)
    return (
      this.related(part, 'theme') ??
      (this.related(part, 'slideMaster')
        ? this.themePart(this.related(part, 'slideMaster')!, seen)
        : this.related(part, 'slideLayout')
          ? this.themePart(this.related(part, 'slideLayout')!, seen)
          : undefined)
    )
  }
  private effectiveColorMap(part: string, seen = new Set<string>()): any {
    if (seen.has(part)) throw Error('Cyclic color mapping inheritance')
    seen.add(part)
    const root = this.doc(part).documentElement
    const direct = child(root, 'clrMap', this.P)
    if (direct) return direct
    const override = child(root, 'clrMapOvr', this.P),
      mapping = override && child(override, 'overrideClrMapping', this.A)
    if (mapping) return mapping
    const layout = this.related(part, 'slideLayout'),
      master = this.related(layout ?? part, 'slideMaster')
    if (override && child(override, 'masterClrMapping', this.A))
      return master ? this.effectiveColorMap(master, seen) : undefined
    const parent = layout ?? master
    return parent ? this.effectiveColorMap(parent, seen) : undefined
  }
  private color(node: any, part: string): string | undefined {
    const base = this.baseColor(node, part)
    if (!base || !node) return base
    const properties =
      child(node, 'bgPr', this.P) ?? child(node, 'bgRef', this.P) ?? node
    const fill = child(properties, 'solidFill', this.A) ?? properties
    const color = kids(fill).find(
      (v) =>
        v.namespaceURI === this.A &&
        ['srgbClr', 'sysClr', 'schemeClr'].includes(v.localName)
    )
    return applyColorTransforms(base, color)
  }
  private assetUrl(part: string, id: string | undefined): string | undefined {
    const rel = this.relations(part).find((r) => r.getAttribute('Id') === id)
    if (!rel || rel.getAttribute('TargetMode') === 'External') return undefined
    const target = path(part, rel.getAttribute('Target')),
      data = this.parts[target]
    if (!data) return undefined
    const cached = assetUrls.get(data)
    if (cached) return cached
    const ct = this.doc('[Content_Types].xml'),
      ext = target.split('.').at(-1)?.toLowerCase()
    const mime =
      all(ct, 'Override')
        .find((n) => n.getAttribute('PartName') === '/' + target)
        ?.getAttribute('ContentType') ??
      all(ct, 'Default')
        .find((n) => n.getAttribute('Extension').toLowerCase() === ext)
        ?.getAttribute('ContentType') ??
      'application/octet-stream'
    if (['video/mp4', 'audio/mpeg'].includes(mime)) {
      try {
        validateAsset(data, mime)
      } catch {
        return undefined
      }
    }
    let binary = ''
    for (let i = 0; i < data.length; i += 8192)
      binary += String.fromCharCode(...data.subarray(i, i + 8192))
    const url = `data:${mime};base64,${btoa(binary)}`
    assetUrls.set(data, url)
    return url
  }
  private paint(
    node: any,
    part: string,
    context = part
  ): DrawingPaint | undefined {
    if (!node) return undefined
    const properties = child(node, 'bgPr', this.P) ?? node
    const gradient = child(properties, 'gradFill', this.A)
    if (gradient) {
      const stops = kids(child(gradient, 'gsLst', this.A) ?? {})
        .filter((n) => n.localName === 'gs')
        .slice(0, 256)
        .map((stop) => ({
          offset: Number(stop.getAttribute('pos')) / 100000,
          color: this.color(stop, context) ?? '#000000',
        }))
        .sort((a, b) => a.offset - b.offset)
      if (!stops.length) return undefined
      const path = child(gradient, 'path', this.A)
      const rect = (node: any) => ({
        left: Number(node?.getAttribute('l') || 0) / 100000,
        top: Number(node?.getAttribute('t') || 0) / 100000,
        right: Number(node?.getAttribute('r') || 0) / 100000,
        bottom: Number(node?.getAttribute('b') || 0) / 100000,
      })
      return {
        kind: 'gradient',
        stops,
        angle: path
          ? undefined
          : Number(child(gradient, 'lin', this.A)?.getAttribute('ang') || 0) /
            60000,
        path: path?.getAttribute('path'),
        focus: rect(child(path, 'fillToRect', this.A)),
        tile: rect(child(gradient, 'tileRect', this.A)),
      }
    }
    const image =
      child(properties, 'blipFill', this.P) ??
      child(properties, 'blipFill', this.A)
    if (image) {
      const src = this.assetUrl(
        part,
        child(image, 'blip', this.A)?.getAttribute('r:embed')
      )
      if (src)
        return { kind: 'image', src, tile: !!child(image, 'tile', this.A) }
    }
    const pattern = child(properties, 'pattFill', this.A)
    if (pattern)
      return {
        kind: 'pattern',
        preset: pattern.getAttribute('prst'),
        foreground:
          this.color(child(pattern, 'fgClr', this.A), context) ?? '#000000',
        background:
          this.color(child(pattern, 'bgClr', this.A), context) ?? '#FFFFFF',
      }
    return undefined
  }
  private baseColor(node: any, part: string): string | undefined {
    if (!node) return undefined
    const properties =
      child(node, 'bgPr', this.P) ?? child(node, 'bgRef', this.P) ?? node
    const fill = child(properties, 'solidFill', this.A) ?? properties
    const colorNode = kids(fill).find(
      (v) =>
        v.namespaceURI === this.A &&
        ['srgbClr', 'sysClr', 'schemeClr'].includes(v.localName)
    )
    if (!colorNode) return undefined
    if (colorNode.localName === 'srgbClr')
      return '#' + colorNode.getAttribute('val')
    if (colorNode.localName === 'sysClr')
      return '#' + colorNode.getAttribute('lastClr')
    const scheme = colorNode
    const source = scheme.getAttribute('val'),
      mapping = this.effectiveColorMap(part)
    const key =
      mapping?.getAttribute(source) ||
      (
        { bg1: 'lt1', bg2: 'lt2', tx1: 'dk1', tx2: 'dk2' } as Record<
          string,
          string
        >
      )[source] ||
      source
    const theme = this.themePart(part)
    if (!theme) return undefined
    const schemeList = descendants(this.doc(theme), 'clrScheme', this.A)[0],
      value = child(schemeList, key, this.A)
    // Theme colors must resolve to concrete RGB/system values, not recurse through the same map.
    const concrete =
      value &&
      (child(value, 'srgbClr', this.A) ?? child(value, 'sysClr', this.A))
    return concrete
      ? '#' +
          (concrete.localName === 'sysClr'
            ? concrete.getAttribute('lastClr')
            : concrete.getAttribute('val'))
      : undefined
  }
  private readTextBody(textBody: any): string {
    return textBody
      ? kids(textBody)
          .filter((v) => v.namespaceURI === this.A && v.localName === 'p')
          .map((p) =>
            kids(p)
              .filter((v) => v.namespaceURI === this.A)
              .map((v) =>
                v.localName === 'br'
                  ? '\n'
                  : ['r', 'fld'].includes(v.localName)
                    ? (child(v, 't', this.A)?.textContent ?? '')
                    : ''
              )
              .join('')
          )
          .join('\n')
      : ''
  }
  private isOpaqueTextElement(node: any) {
    return node.namespaceURI !== this.A || node.localName === 'extLst'
  }
  private isOpaqueTextAttribute(attribute: any) {
    return (
      attribute.namespaceURI &&
      ![
        this.R,
        'http://www.w3.org/XML/1998/namespace',
        'http://www.w3.org/2000/xmlns/',
      ].includes(attribute.namespaceURI)
    )
  }
  private hasOpaqueTextData(node: any): boolean {
    return (
      this.isOpaqueTextElement(node) ||
      Array.from(node.attributes).some((attribute) =>
        this.isOpaqueTextAttribute(attribute)
      ) ||
      kids(node).some((element) => this.hasOpaqueTextData(element))
    )
  }
  private copyTextFormatting(source: any, target: any) {
    for (const attribute of Array.from(source.attributes) as any[])
      if (!this.isOpaqueTextAttribute(attribute))
        target.setAttributeNS(
          attribute.namespaceURI,
          attribute.name,
          attribute.value
        )
    for (const node of kids(source)) {
      if (this.isOpaqueTextElement(node)) continue
      const element = target.ownerDocument.createElementNS(
        this.A,
        node.nodeName
      )
      this.copyTextFormatting(node, element)
      target.appendChild(element)
    }
  }
  private writeTextBody(body: any, text: string) {
    const paragraphs = kids(body).filter(
      (p) => p.namespaceURI === this.A && p.localName === 'p'
    )
    const lines = text.replace(/\r\n?/g, '\n').split('\n')
    if (paragraphs.slice(lines.length).some((p) => this.hasOpaqueTextData(p)))
      throw Error('Cannot remove opaque paragraph data')
    lines.forEach((line, index) => {
      let p = paragraphs[index]
      if (!p) {
        p = body.ownerDocument.createElementNS(this.A, 'a:p')
        const template = paragraphs.at(-1)
        const pp = child(template, 'pPr', this.A)
        if (pp) {
          const properties = body.ownerDocument.createElementNS(this.A, 'a:pPr')
          this.copyTextFormatting(pp, properties)
          p.appendChild(properties)
        }
        body.appendChild(p)
      }
      for (const br of kids(p).filter(
        (v) => v.namespaceURI === this.A && v.localName === 'br'
      )) {
        if (this.hasOpaqueTextData(br))
          throw Error('Cannot remove opaque paragraph break data')
        p.removeChild(br)
      }
      let texts = kids(p)
        .filter(
          (v) => v.namespaceURI === this.A && ['r', 'fld'].includes(v.localName)
        )
        .flatMap((v) =>
          kids(v).filter(
            (t) => t.namespaceURI === this.A && t.localName === 't'
          )
        )
      if (!texts.length) {
        const r = body.ownerDocument.createElementNS(this.A, 'a:r'),
          t = body.ownerDocument.createElementNS(this.A, 'a:t')
        const source = paragraphs[Math.min(index, paragraphs.length - 1)] ?? p
        const rp =
          descendants(source, 'rPr', this.A)[0] ??
          descendants(source, 'defRPr', this.A)[0] ??
          child(source, 'endParaRPr', this.A)
        if (rp) {
          // Paragraph defaults/end properties share the character-property type,
          // but only rPr is valid as a text run child.
          const runProperties = body.ownerDocument.createElementNS(
            this.A,
            'a:rPr'
          )
          this.copyTextFormatting(rp, runProperties)
          r.appendChild(runProperties)
        }
        r.appendChild(t)
        p.insertBefore(
          r,
          kids(p).find((v) => v.localName === 'endParaRPr') ?? null
        )
        texts = [t]
      }
      const old = texts.map((t) => t.textContent).join('')
      let prefix = 0,
        suffix = 0
      while (
        prefix < old.length &&
        prefix < line.length &&
        old[prefix] === line[prefix]
      )
        prefix++
      while (
        suffix < old.length - prefix &&
        suffix < line.length - prefix &&
        old[old.length - 1 - suffix] === line[line.length - 1 - suffix]
      )
        suffix++
      let offset = 0,
        inserted = false
      const replacement = line.slice(prefix, line.length - suffix)
      for (const t of texts) {
        const text = t.textContent || '',
          from = offset,
          to = offset + text.length
        offset = to
        const before = text.slice(
            0,
            Math.max(0, Math.min(text.length, prefix - from))
          ),
          after = text.slice(
            Math.max(0, Math.min(text.length, old.length - suffix - from))
          )
        const insert = !inserted && prefix <= to
        if (insert) inserted = true
        t.textContent = before + (insert ? replacement : '') + after
        if (/^\s|\s$/.test(t.textContent))
          t.setAttribute('xml:space', 'preserve')
      }
    })
    for (const p of paragraphs.slice(lines.length)) body.removeChild(p)
  }
  private readTextStyle(rp: any, pp: any, part: string): TextStyle {
    const style: TextStyle = {}
    for (const [key, attr] of [
      ['bold', 'b'],
      ['italic', 'i'],
      ['underline', 'u'],
    ] as const)
      if (rp?.hasAttribute(attr))
        style[key] =
          key === 'underline'
            ? !['none', '0', 'false'].includes(rp.getAttribute(attr))
            : ['1', 'true'].includes(rp.getAttribute(attr))
    if (rp?.hasAttribute('sz'))
      style.fontSize = Number(rp.getAttribute('sz')) / 75
    const latin = rp && child(rp, 'latin', this.A)
    if (latin)
      style.fontFamily = this.font(latin.getAttribute('typeface'), part)
    if (rp) {
      const color = this.color(rp, part)
      if (color) style.color = color
    }
    const align = pp?.getAttribute('algn')
    if (align)
      style.align = ({ l: 'left', ctr: 'center', r: 'right' } as const)[
        align as 'l' | 'ctr' | 'r'
      ]
    return style
  }
  private paragraphInfo(shape: any) {
    const body = child(shape, 'txBody', this.P),
      paragraph = body && child(body, 'p', this.A),
      pp = paragraph && child(paragraph, 'pPr', this.A)
    const level = Number(pp?.getAttribute('lvl') || 0)
    return { body, paragraph, pp, level }
  }
  private listTextStyle(list: any, level: number, context: string): TextStyle {
    const defaults = child(list, 'defPPr', this.A),
      specific = child(list, 'lvl' + (level + 1) + 'pPr', this.A)
    return {
      ...this.readTextStyle(
        child(defaults, 'defRPr', this.A),
        defaults,
        context
      ),
      ...this.readTextStyle(
        child(specific, 'defRPr', this.A),
        specific,
        context
      ),
    }
  }
  private shapeTextStyle(
    shape: any,
    context: string,
    levelOverride?: number
  ): TextStyle {
    const { body, paragraph, pp, level } = this.paragraphInfo(shape)
    if (!body) return {}
    const list = child(body, 'lstStyle', this.A)
    const run =
      paragraph &&
      kids(paragraph).find(
        (v) => v.namespaceURI === this.A && ['r', 'fld'].includes(v.localName)
      )
    const rp = run
      ? child(run, 'rPr', this.A)
      : paragraph && child(paragraph, 'endParaRPr', this.A)
    return {
      ...this.listTextStyle(list, levelOverride ?? level, context),
      ...this.readTextStyle(pp && child(pp, 'defRPr', this.A), pp, context),
      ...this.readTextStyle(rp, undefined, context),
    }
  }
  private inheritedTextStyle(
    master: string | undefined,
    type: string,
    level: number,
    context: string
  ): TextStyle {
    const presentation = this.doc(this.presentation).documentElement
    const defaults = child(presentation, 'defaultTextStyle', this.P)
    let style = this.listTextStyle(defaults, level, context)
    if (master) {
      const styles = child(this.doc(master).documentElement, 'txStyles', this.P)
      const group =
        styles &&
        child(
          styles,
          ['title', 'ctrTitle'].includes(type)
            ? 'titleStyle'
            : ['body', 'subTitle', 'obj'].includes(type)
              ? 'bodyStyle'
              : 'otherStyle',
          this.P
        )
      style = { ...style, ...this.listTextStyle(group, level, context) }
    }
    return style
  }
  private font(name: string | undefined, part: string): string | undefined {
    if (!name?.startsWith('+')) return name
    const theme = this.themePart(part)
    if (!theme) return undefined
    const group = first(
      this.doc(theme),
      name.startsWith('+mj') ? 'majorFont' : 'minorFont'
    )
    if (!group) return undefined
    return (
      first(
        group,
        name.endsWith('-ea') ? 'ea' : name.endsWith('-cs') ? 'cs' : 'latin'
      )?.getAttribute('typeface') ||
      first(group, 'latin')?.getAttribute('typeface')
    )
  }
  private richText(shape: any, context: string) {
    const body = child(shape, 'txBody', this.P)
    if (!body) return undefined
    const ph = first(shape, 'ph'),
      layout = this.related(context, 'slideLayout'),
      master = this.related(layout ?? context, 'slideMaster')
    const templates: any[] = []
    let type = ph?.getAttribute('type') || 'other'
    if (ph) {
      if (layout) {
        const match = descendants(this.doc(layout), 'ph', this.P).find(
          (p) =>
            (p.getAttribute('idx') || '0') === (ph.getAttribute('idx') || '0')
        )
        if (match) {
          templates.unshift(match.parentNode.parentNode)
          type = match.getAttribute('type') || 'obj'
        }
      }
      if (master) {
        const match = descendants(this.doc(master), 'ph', this.P).find(
          (p) => (p.getAttribute('type') || 'obj') === type
        )
        if (match) templates.unshift(match.parentNode.parentNode)
      }
    }
    const effective = body.cloneNode(true),
      props = child(effective, 'bodyPr', this.A)
    if (props)
      for (const template of [...templates].reverse()) {
        const inherited = child(
          child(template, 'txBody', this.P),
          'bodyPr',
          this.A
        )
        for (const attr of Array.from(inherited?.attributes ?? []) as any[])
          if (!props.hasAttribute(attr.name))
            props.setAttribute(attr.name, attr.value)
      }
    return readRichText(effective, this.A, {
      baseStyle: (level) =>
        Object.assign(
          { fontSize: 24 },
          this.inheritedTextStyle(master, type, level, context),
          ...templates.map((template) =>
            this.shapeTextStyle(template, context, level)
          )
        ),
      readStyle: (run, paragraph) =>
        this.readTextStyle(
          run
            ? child(run, 'rPr', this.A)
            : child(child(paragraph, 'pPr', this.A), 'defRPr', this.A),
          child(paragraph, 'pPr', this.A),
          context
        ),
      font: (name) => this.font(name, context),
      color: (node) =>
        this.color(
          ['srgbClr', 'schemeClr', 'sysClr'].includes(node?.localName)
            ? node.parentNode
            : node,
          context
        ),
    })
  }
  getScene(): PresentationScene {
    return this.sceneFor()
  }
  private sceneFor(onlyPart?: string): PresentationScene {
    const p = this.doc(this.presentation),
      sz = first(p, 'sldSz')
    const diagnostics: PresentationScene['diagnostics'] = []
    const page = (part: string, inherit = true): ScenePage => {
      const key = part + ':' + inherit
      let cached = this.pageCache.get(key)
      if (!cached) {
        const start = diagnostics.length
        const result = buildPage(part, inherit)
        cached = {
          page: structuredClone(result),
          diagnostics: diagnostics.splice(start),
        }
        this.pageCache.set(key, cached)
      }
      diagnostics.push(...structuredClone(cached.diagnostics))
      return structuredClone(cached.page)
    }
    const buildPage = (part: string, inherit = true): ScenePage => {
      const d = this.doc(part),
        c = first(d, 'cSld'),
        layoutPart = this.related(part, 'slideLayout'),
        masterPart = this.related(layoutPart || part, 'slideMaster')
      let objects = this.objects(part, diagnostics)
      const templates = [layoutPart, masterPart]
        .filter(Boolean)
        .map((p) => this.objects(p!, diagnostics, part))
      if (inherit) {
        for (const object of objects) {
          let inheritedType = object.placeholder?.split(':')[0] ?? 'other'
          const shape = descendants(d, 'cNvPr', this.P).find(
            (n) => n.getAttribute('id') === object.id
          )?.parentNode?.parentNode
          const paragraphLevel = shape ? this.paragraphInfo(shape).level : 0
          if (object.placeholder) {
            const [type, idx] = object.placeholder.split(':')
            inheritedType = type
            for (let level = 0; level < templates.length; level++) {
              const template = templates[level]!.find(
                (t) =>
                  t.placeholder &&
                  (level === 0
                    ? t.placeholder.split(':')[1] === idx
                    : t.placeholder.split(':')[0] === inheritedType)
              )
              if (!template) continue
              inheritedType = template.placeholder!.split(':')[0]!
              if (!object.width && !object.height) {
                object.x = template.x
                object.y = template.y
                object.width = template.width
                object.height = template.height
                object.rotation = template.rotation
              }
              object.style = {
                ...this.shapeTextStyle(
                  descendants(this.doc(template.part), 'cNvPr', this.P).find(
                    (n) => n.getAttribute('id') === template.id
                  )?.parentNode?.parentNode,
                  part,
                  paragraphLevel
                ),
                ...Object.fromEntries(
                  Object.entries(object.style ?? {}).filter(
                    ([, v]) => v !== undefined
                  )
                ),
              }
            }
          }
          object.style = {
            ...this.inheritedTextStyle(
              masterPart,
              inheritedType,
              paragraphLevel,
              part
            ),
            ...object.style,
          }
          if (shape && ['sp', 'cxnSp'].includes(shape.localName))
            this.readGeometry(object, shape)
        }
        const showMaster =
          !['0', 'false'].includes(
            d.documentElement.getAttribute('showMasterSp')
          ) &&
          (!layoutPart ||
            !['0', 'false'].includes(
              this.doc(layoutPart).documentElement.getAttribute('showMasterSp')
            ))
        const masterObjects =
          showMaster && masterPart
            ? this.objects(masterPart, diagnostics, part).filter(
                (o) => !o.placeholder
              )
            : []
        const layoutObjects = layoutPart
          ? this.objects(layoutPart, diagnostics, part).filter(
              (o) => !o.placeholder
            )
          : []
        objects = [
          ...[...masterObjects, ...layoutObjects].map((o) => ({
            ...o,
            inherited: true,
          })),
          ...objects,
        ]
      }
      const bg = [part, layoutPart, masterPart]
        .filter(Boolean)
        .map((p) => ({ part: p!, bg: first(this.doc(p!), 'bg') }))
        .find((v) => v.bg)
      for (const object of objects) {
        if (object.kind === 'text' || object.kind === 'shape') {
          object.richText = this.richText(this.element(object, false), part)
        }
      }
      return {
        id: part,
        part,
        name: c?.getAttribute('name') || part.split('/').at(-1)!,
        background: bg ? (this.color(bg.bg, part) ?? '#FFFFFF') : '#FFFFFF',
        backgroundPaint: bg ? this.paint(bg.bg, bg.part, part) : undefined,
        objects,
        layoutPart,
        masterPart,
      }
    }
    return {
      title: this.parts['docProps/core.xml']
        ? first(this.doc('docProps/core.xml'), 'title')?.textContent ||
          'Untitled'
        : 'Untitled',
      width: Number(sz?.getAttribute('cx') || 12192000) / E,
      height: Number(sz?.getAttribute('cy') || 6858000) / E,
      variant: p.documentElement.namespaceURI?.includes('purl.oclc.org')
        ? 'strict'
        : 'transitional',
      slides: this.ordered()
        .filter((x) => !onlyPart || x === onlyPart)
        .map((x) => page(x)),
      masters: this.relatedParts(this.presentation, 'slideMaster')
        .filter((x) => !onlyPart || x === onlyPart)
        .map((x) => page(x, false)),
      layouts: [
        ...new Set(
          this.relatedParts(this.presentation, 'slideMaster').flatMap((m) =>
            this.relatedParts(m, 'slideLayout')
          )
        ),
      ]
        .filter((x) => !onlyPart || x === onlyPart)
        .map((x) => page(x, false)),
      diagnostics,
    }
  }
  private objects(
    part: string,
    diagnostics: PresentationScene['diagnostics'],
    context = part
  ): SceneObject[] {
    const d = this.doc(part)
    const walk = (
      tree: any,
      tx = { x: 0, y: 0, sx: 1, sy: 1 }
    ): SceneObject[] =>
      kids(tree).flatMap((n) => {
        if (['nvGrpSpPr', 'grpSpPr', 'extLst'].includes(n.localName)) return []
        const xf = first(n, 'xfrm'),
          off = xf && first(xf, 'off'),
          ext = xf && first(xf, 'ext')
        const x = Number(off?.getAttribute('x') || 0) / E,
          y = Number(off?.getAttribute('y') || 0) / E,
          w = Number(ext?.getAttribute('cx') || 0) / E,
          h = Number(ext?.getAttribute('cy') || 0) / E
        if (n.localName === 'grpSp') {
          if (
            xf?.getAttribute('rot') ||
            xf?.getAttribute('flipH') === '1' ||
            xf?.getAttribute('flipV') === '1'
          )
            diagnostics.push({
              code: 'group-transform',
              part,
              severity: 'warning',
              message: '旋转或翻转分组的预览尚不完整，原始数据保留',
            })
          const co = first(xf, 'chOff'),
            ce = first(xf, 'chExt')
          const sx = w / (Number(ce?.getAttribute('cx') || w * E) / E || 1),
            sy = h / (Number(ce?.getAttribute('cy') || h * E) / E || 1)
          return walk(n, {
            x:
              tx.x +
              tx.sx * (x - (Number(co?.getAttribute('x') || 0) / E) * sx),
            y:
              tx.y +
              tx.sy * (y - (Number(co?.getAttribute('y') || 0) / E) * sy),
            sx: tx.sx * sx,
            sy: tx.sy * sy,
          })
        }
        const nv = first(n, 'cNvPr'),
          ph = first(n, 'ph')
        const o: SceneObject = {
          id: nv?.getAttribute('id') || 'unknown',
          part,
          name: nv?.getAttribute('name') || '',
          kind: 'unsupported',
          x: tx.x + x * tx.sx,
          y: tx.y + y * tx.sy,
          width: w * tx.sx,
          height: h * tx.sy,
          rotation: Number(xf?.getAttribute('rot') || 0) / 60000,
          flipH: ['1', 'true'].includes(xf?.getAttribute('flipH')),
          flipV: ['1', 'true'].includes(xf?.getAttribute('flipV')),
          placeholder: ph
            ? `${ph.getAttribute('type') || 'obj'}:${ph.getAttribute('idx') || '0'}`
            : undefined,
        }
        if (n.localName === 'sp' || n.localName === 'cxnSp') {
          o.kind = first(n, 'txBody') ? 'text' : 'shape'
          const textBody = child(n, 'txBody', this.P)
          o.text = this.readTextBody(textBody)
          o.geometry = first(n, 'prstGeom')?.getAttribute('prst') || 'rect'
          this.readGeometry(o, n)
          o.style = this.shapeTextStyle(n, context)
          const sp = first(n, 'spPr')
          const fillProperties = this.effectiveFill(n, sp)
          const fill = child(fillProperties, 'solidFill', this.A)
          const style = child(n, 'style', this.P)
          o.fill = child(fillProperties, 'noFill', this.A)
            ? 'none'
            : (this.color(fill, context) ??
              this.color(child(style, 'fillRef', this.A), context))
          o.paint = this.paint(fillProperties, part, context)
          const ln = sp && kids(sp).find((x) => x.localName === 'ln')
          o.stroke = child(ln, 'noFill', this.A)
            ? 'none'
            : (this.color(ln, context) ??
              this.color(child(style, 'lnRef', this.A), context))
          o.strokeDash = child(ln, 'prstDash', this.A)?.getAttribute('val')
          o.headEnd = child(ln, 'headEnd', this.A)?.getAttribute('type')
          o.tailEnd = child(ln, 'tailEnd', this.A)?.getAttribute('type')
          if (ln?.getAttribute('w'))
            o.strokeWidth = Number(ln.getAttribute('w')) / E
        } else if (n.localName === 'pic') {
          o.kind = 'image'
          o.src = this.assetUrl(part, first(n, 'blip')?.getAttribute('r:embed'))
          const rect = first(n, 'srcRect')
          if (rect) {
            const crop = {
              left: Number(rect.getAttribute('l') || 0) / 100000,
              right: Number(rect.getAttribute('r') || 0) / 100000,
              top: Number(rect.getAttribute('t') || 0) / 100000,
              bottom: Number(rect.getAttribute('b') || 0) / 100000,
            }
            if (
              Object.values(crop).every(
                (v) => Number.isFinite(v) && Math.abs(v) <= 10
              ) &&
              crop.left + crop.right < 1 &&
              crop.top + crop.bottom < 1
            )
              o.crop = crop
          }
          const media = this.pictureMedia(n, part)
          if (media.length) {
            const resource = media
              .map((r) => this.assetUrl(part, r.getAttribute('Id')))
              .find(
                (src) =>
                  src?.startsWith('data:video/mp4;') ||
                  src?.startsWith('data:audio/mpeg;')
              )
            if (resource) {
              o.kind = 'media'
              o.poster = o.src
              o.src = resource
              o.mediaType = resource.startsWith('data:audio/')
                ? 'audio'
                : 'video'
            }
          }
        } else {
          const table = this.table(n)
          if (table) {
            o.kind = 'table'
            o.tableCells = this.tableMetadata(table, context).cells
            o.columnWidths = kids(child(table, 'tblGrid', this.A) ?? {})
              .filter(
                (node) =>
                  node.localName === 'gridCol' && node.namespaceURI === this.A
              )
              .map((column) => Number(column.getAttribute('w')) / E)
            o.rowHeights = kids(table)
              .filter(
                (node) =>
                  node.localName === 'tr' && node.namespaceURI === this.A
              )
              .map((row) => Number(row.getAttribute('h')) / E)
            o.cells = this.tableRows(table).map((row) =>
              row.map((cell) =>
                this.readTextBody(child(cell, 'txBody', this.A))
              )
            )
          } else if (this.diagramParts(n, part)) {
            const diagram = this.diagramParts(n, part)!
            o.kind = 'diagram'
            o.childCoordinateSize = { width: w, height: h }
            o.children = readDiagramObjects(
              this.doc(diagram.data),
              this.doc(diagram.drawing),
              diagram.drawing,
              this.A,
              {
                color: (node) => this.color(node, context),
                font: (name) => this.font(name, context),
                readStyle: (run, paragraph) =>
                  this.readTextStyle(run, paragraph, context),
              }
            )
            const nodes = diagramNodes(
              this.doc(diagram.data),
              this.doc(diagram.drawing)
            )
            o.diagramTexts = [
              ...new Map(
                nodes
                  .filter(
                    (node) =>
                      node.dataId &&
                      child(node.point, 't', node.point.namespaceURI)
                  )
                  .map((node) => [
                    node.dataId!,
                    {
                      id: node.dataId!,
                      text: this.readTextBody(
                        child(node.point, 't', node.point.namespaceURI)
                      ),
                    },
                  ])
              ).values(),
            ]
          } else
            diagnostics.push({
              code: 'unsupported-object',
              message: `Unsupported ${n.localName} preserved`,
              part,
              severity: 'warning',
            })
        }
        if (
          (first(n, 'custGeom') && !o.paths) ||
          (first(n, 'srcRect') && !o.crop) ||
          first(n, 'blip')?.getAttribute('r:link')
        )
          diagnostics.push({
            code: 'unsupported-visual-feature',
            part,
            severity: 'warning',
            message: '自定义形状、图片裁剪或外链图片尚未完整呈现，原始数据保留',
          })
        return [o]
      })
    return walk(first(d, 'spTree'))
  }
  // Package byte arrays are immutable after insertion. XML edits live in private
  // DOMs; snapshots serialize only edited XML and share all untouched assets.
  private snapshotParts() {
    const out = { ...this.parts }
    for (const p of this.dirty) out[p] = strToU8(ser(this.docs.get(p)))
    return out
  }
  export() {
    return zipSync(this.snapshotParts(), {
      level: 6,
      mtime: new Date('2000-01-01'),
    })
  }
  clone() {
    const copy = new OfficeDocument()
    copy.parts = this.snapshotParts()
    copy.presentation = this.presentation
    copy.strict = this.strict
    copy.pageCache = new Map(this.pageCache)
    return copy
  }
  execute(command: Command): CommandResult {
    validateCommand(command)
    const partIdentities = { ...this.parts }
    const before = this.snapshotParts()
    const dirty = new Set(this.dirty)
    this.touched.clear()
    try {
      return this.apply(command)
    } catch (e) {
      this.parts = before
      this.docs = new Map()
      this.dirty = dirty
      for (const p of dirty) this.doc(p)
      this.pageCache.clear()
      throw e
    } finally {
      for (const p of this.touched) this.invalidatePart(p)
      // Media writes and deletions replace byte arrays directly.
      for (const p of new Set([
        ...Object.keys(partIdentities),
        ...Object.keys(this.parts),
      ]))
        if (partIdentities[p] !== this.parts[p] && !this.touched.has(p))
          this.pageCache.clear()
    }
  }
  private element(ref: { part: string; id: string }, edit = true) {
    const d = edit ? this.edit(ref.part) : this.doc(ref.part)
    const nv = all(d, 'cNvPr').find((n) => n.getAttribute('id') === ref.id)
    if (!nv) throw Error('Object not found')
    let n = nv.parentNode
    while (
      n.parentNode &&
      n.parentNode !== first(d, 'spTree') &&
      n.parentNode.localName !== 'grpSp'
    )
      n = n.parentNode
    return n
  }
  private table(node: any) {
    const graphic = child(node, 'graphic', this.A)
    return child(child(graphic, 'graphicData', this.A), 'tbl', this.A)
  }
  private effectiveFill(node: any, properties: any) {
    if (!child(properties, 'grpFill', this.A)) return properties
    for (let parent = node.parentNode; parent; parent = parent.parentNode) {
      if (parent.localName !== 'grpSp') continue
      const group = child(parent, 'grpSpPr', this.P)
      if (child(group, 'grpFill', this.A)) continue
      // A missing explicit group fill terminates inheritance at that group.
      return group
    }
    return properties
  }
  private diagramParts(node: any, part: string) {
    if (node.localName !== 'graphicFrame') return undefined
    const relIds = first(node, 'relIds')
    if (!relIds) return undefined
    const resolve = (source: string, id: string, type: string) => {
      const relation = this.relations(source).find(
        (r) =>
          r.getAttribute('Id') === id &&
          r.getAttribute('Type').endsWith('/' + type) &&
          r.getAttribute('TargetMode') !== 'External'
      )
      if (!relation) return undefined
      const target = path(source, relation.getAttribute('Target'))
      return this.parts[target] ? target : undefined
    }
    const data = resolve(part, relIds.getAttribute('r:dm'), 'diagramData')
    if (!data) return undefined
    const extension = first(this.doc(data), 'dataModelExt')
    const id = extension?.getAttribute('relId')
    const drawing =
      id &&
      (resolve(data, id, 'diagramDrawing') ??
        resolve(part, id, 'diagramDrawing'))
    return drawing ? { data, drawing } : undefined
  }
  private editableDiagram(node: any, part: string) {
    const diagram = this.diagramParts(node, part)
    if (!diagram) throw Error('Object is not a cached diagram')
    const masters = this.relatedParts(this.presentation, 'slideMaster')
    const pages = new Set([
      ...this.ordered(),
      ...masters,
      ...masters.flatMap((master) => this.relatedParts(master, 'slideLayout')),
    ])
    let uses = 0
    for (const page of pages)
      for (const frame of all(this.doc(page), 'graphicFrame')) {
        const candidate = this.diagramParts(frame, page)
        if (
          candidate &&
          (candidate.data === diagram.data ||
            candidate.drawing === diagram.drawing)
        )
          uses++
      }
    if (uses > 1)
      throw Error('Shared diagram data must be separated before editing')
    return diagram
  }
  private readGeometry(object: SceneObject, node: any) {
    const sp = child(node, 'spPr', this.P)
    const geometry =
      child(sp, 'prstGeom', this.A) ?? child(sp, 'custGeom', this.A)
    const result =
      geometry && shapeGeometry(geometry, object.width, object.height)
    object.paths = result?.paths
    object.textRect = result?.textRect
  }
  private tableRows(table: any): any[][] {
    return kids(table)
      .filter((row) => row.namespaceURI === this.A && row.localName === 'tr')
      .map((row) =>
        kids(row).filter(
          (cell) => cell.namespaceURI === this.A && cell.localName === 'tc'
        )
      )
  }
  private tableMetadata(table: any, context: string) {
    const stylePart = this.related(this.presentation, 'tableStyles')
    const styleId = child(
      child(table, 'tblPr', this.A),
      'tableStyleId',
      this.A
    )?.textContent
    const style = stylePart
      ? descendants(this.doc(stylePart), 'tblStyle', this.A).find(
          (node) => node.getAttribute('styleId') === styleId
        )
      : undefined
    return readTableCells(
      table,
      this.A,
      (node) => this.color(node, context),
      (run, paragraph) => this.readTextStyle(run, paragraph, context),
      style
    )
  }
  private resizeTableAxis(nodes: any[], attribute: string, extent: number) {
    if (!nodes.length || !Number.isSafeInteger(extent) || extent < nodes.length)
      throw Error('Invalid table frame extent')
    const sizes = nodes.map((node) => Number(node.getAttribute(attribute)))
    const total = sizes.reduce((sum, size) => sum + size, 0)
    if (!Number.isSafeInteger(total) || sizes.some((size) => size < 0))
      throw Error('Invalid table grid extent')
    let cumulative = 0
    let previous = 0
    nodes.forEach((node, index) => {
      cumulative += sizes[index]!
      const projected = Math.round(
        extent * (total ? cumulative / total : (index + 1) / nodes.length)
      )
      // Constrain each boundary to leave at least one EMU for every member.
      const boundary = Math.max(
        previous + 1,
        Math.min(projected, extent - (nodes.length - index - 1))
      )
      node.setAttribute(attribute, String(boundary - previous))
      previous = boundary
    })
  }
  private parentTransform(node: any) {
    const ancestors: any[] = []
    for (let p = node.parentNode; p; p = p.parentNode)
      if (p.localName === 'grpSp') ancestors.unshift(p)
    const tx = { x: 0, y: 0, sx: 1, sy: 1 }
    for (const p of ancestors) {
      const xf = first(
        kids(p).find((n) => n.localName === 'grpSpPr'),
        'xfrm'
      )
      if (!xf) continue
      if (
        xf.getAttribute('rot') ||
        xf.getAttribute('flipH') === '1' ||
        xf.getAttribute('flipV') === '1'
      )
        throw Error('Editing rotated/flipped groups is unsupported')
      const off = first(xf, 'off'),
        ext = first(xf, 'ext'),
        co = first(xf, 'chOff'),
        ce = first(xf, 'chExt')
      const sx =
          Number(ext?.getAttribute('cx')) / Number(ce?.getAttribute('cx')),
        sy = Number(ext?.getAttribute('cy')) / Number(ce?.getAttribute('cy'))
      if (!Number.isFinite(sx) || !Number.isFinite(sy) || !sx || !sy)
        throw Error('Invalid group transform')
      tx.x +=
        (tx.sx *
          (Number(off?.getAttribute('x')) -
            Number(co?.getAttribute('x')) * sx)) /
        E
      tx.y +=
        (tx.sy *
          (Number(off?.getAttribute('y')) -
            Number(co?.getAttribute('y')) * sy)) /
        E
      tx.sx *= sx
      tx.sy *= sy
    }
    return tx
  }
  private style(n: any, style: TextStyle) {
    const d = n.ownerDocument,
      targets: any[] = []
    for (const p of descendants(n, 'p', this.A)) {
      const runs = kids(p).filter(
        (v) => v.namespaceURI === this.A && ['r', 'fld'].includes(v.localName)
      )
      for (const run of runs) {
        let rp = child(run, 'rPr', this.A)
        if (!rp) {
          rp = d.createElementNS(this.A, 'a:rPr')
          run.insertBefore(rp, run.firstChild)
        }
        targets.push(rp)
      }
      let pp = child(p, 'pPr', this.A)
      if (!pp) {
        pp = d.createElementNS(this.A, 'a:pPr')
        p.insertBefore(pp, p.firstChild)
      }
      if (style.align)
        pp.setAttribute(
          'algn',
          style.align === 'center' ? 'ctr' : style.align === 'right' ? 'r' : 'l'
        )
      if (!runs.length) {
        let def = child(pp, 'defRPr', this.A)
        if (!def) {
          def = d.createElementNS(this.A, 'a:defRPr')
          pp.insertBefore(def, child(pp, 'extLst', this.A) ?? null)
        }
        targets.push(def)
        let end = child(p, 'endParaRPr', this.A)
        if (!end) {
          end = d.createElementNS(this.A, 'a:endParaRPr')
          p.appendChild(end)
        }
        targets.push(end)
      }
    }
    for (const rp of targets) {
      for (const [key, attr] of [
        ['bold', 'b'],
        ['italic', 'i'],
        ['underline', 'u'],
      ] as const)
        if (style[key] !== undefined)
          rp.setAttribute(
            attr,
            key === 'underline'
              ? style[key]
                ? 'sng'
                : 'none'
              : style[key]
                ? '1'
                : '0'
          )
      if (style.fontSize !== undefined)
        rp.setAttribute('sz', String(Math.round(style.fontSize * 75)))
      if (style.color) {
        for (const el of kids(rp).filter(
          (v) => v.namespaceURI === this.A && fillChoices.includes(v.localName)
        ))
          rp.removeChild(el)
        const fill = d.createElementNS(this.A, 'a:solidFill'),
          rgb = d.createElementNS(this.A, 'a:srgbClr')
        rgb.setAttribute('val', style.color.replace('#', ''))
        fill.appendChild(rgb)
        orderedChild(rp, fill, runOrder, this.A)
      }
      if (style.fontFamily) {
        let latin = child(rp, 'latin', this.A)
        if (!latin) {
          latin = d.createElementNS(this.A, 'a:latin')
          orderedChild(rp, latin, runOrder, this.A)
        }
        latin.setAttribute('typeface', style.fontFamily)
      }
    }
  }
  private relativeTarget(base: string, target: string) {
    const from = base.split('/').slice(0, -1),
      to = target.split('/')
    while (from.length && to.length && from[0] === to[0]) {
      from.shift()
      to.shift()
    }
    return '../'.repeat(from.length) + to.join('/')
  }
  private copyGraph(
    source: OfficeDocument,
    part: string,
    mapping: Map<string, string>
  ): string {
    const existing = mapping.get(part)
    if (existing) return existing
    const sourceBytes = source.dirty.has(part)
      ? strToU8(ser(source.docs.get(part)))
      : source.parts[part]
    if (!sourceBytes) throw new Error('Missing dependency ' + part)
    const folder = part.split('/').slice(0, -1).join('/'),
      name = part.split('/').at(-1)!
    let counter = 1,
      target: string
    do {
      target = (folder ? folder + '/' : '') + 'copy' + counter++ + '-' + name
    } while (this.parts[target])
    mapping.set(part, target)
    this.parts[target] = sourceBytes.slice()
    if (part.endsWith('.xml') && source.strict !== this.strict) {
      const original = source.doc(part),
        convert = (node: any, owner: any): any => {
          if (node.nodeType !== 1) return owner.importNode(node, true)
          const namespaces = new Map([
            [source.P, this.P],
            [source.A, this.A],
            [source.R, this.R],
          ])
          const out = owner.createElementNS(
            namespaces.get(node.namespaceURI) ?? node.namespaceURI,
            node.nodeName
          )
          for (const attr of Array.from(node.attributes) as any[]) {
            let value = attr.value
            if (attr.namespaceURI === 'http://www.w3.org/2000/xmlns/')
              value = namespaces.get(value) ?? value
            else if (
              node.namespaceURI === source.A &&
              node.localName === 'graphicData' &&
              attr.name === 'uri' &&
              value === source.tableUri
            )
              value = this.tableUri
            out.setAttributeNS(
              namespaces.get(attr.namespaceURI) ?? attr.namespaceURI,
              attr.name,
              value
            )
          }
          for (const child of Array.from(node.childNodes) as any[])
            out.appendChild(convert(child, owner))
          return out
        }
      const converted = xml('<root/>')
      converted.replaceChild(
        convert(original.documentElement, converted),
        converted.documentElement
      )
      this.put(target, ser(converted))
    }
    const sourceCT = source.doc('[Content_Types].xml'),
      mime =
        all(sourceCT, 'Override')
          .find((n) => n.getAttribute('PartName') === '/' + part)
          ?.getAttribute('ContentType') ??
        all(sourceCT, 'Default')
          .find((n) => n.getAttribute('Extension') === name.split('.').at(-1))
          ?.getAttribute('ContentType')
    if (mime) {
      const ct = this.edit('[Content_Types].xml'),
        entry = ct.createElementNS(ct.documentElement.namespaceURI, 'Override')
      entry.setAttribute('PartName', '/' + target)
      entry.setAttribute('ContentType', mime)
      ct.documentElement.appendChild(entry)
    }
    const rp = relpath(part)
    if (source.parts[rp]) {
      const rels = xml(ser(source.doc(rp)))
      for (const rel of all(rels, 'Relationship')) {
        if (rel.getAttribute('Type').startsWith(source.R + '/'))
          rel.setAttribute(
            'Type',
            this.R + rel.getAttribute('Type').slice(source.R.length)
          )
        if (rel.getAttribute('TargetMode') === 'External') continue
        const dependency = path(part, rel.getAttribute('Target')),
          copied = this.copyGraph(source, dependency, mapping)
        rel.setAttribute('Target', this.relativeTarget(target, copied))
      }
      this.put(relpath(target), ser(rels))
    }
    return target
  }
  private registerSlide(part: string) {
    const d = this.edit(this.presentation),
      list = first(d, 'sldIdLst'),
      entry = d.createElementNS(this.P, 'p:sldId')
    entry.setAttribute(
      'id',
      String(
        Math.max(
          255,
          ...all(d, 'sldId').map((n) => Number(n.getAttribute('id')))
        ) + 1
      )
    )
    entry.setAttributeNS(
      this.R,
      'r:id',
      this.relation(this.presentation, part, 'slide')
    )
    list.appendChild(entry)
  }
  private registerCopiedMasters(
    source: OfficeDocument,
    map: Map<string, string>
  ) {
    for (const [original, copied] of map)
      if (
        original !== copied &&
        original.endsWith('.xml') &&
        source.doc(original).documentElement.localName === 'sldMaster'
      ) {
        const d = this.edit(this.presentation),
          list = first(d, 'sldMasterIdLst'),
          entry = d.createElementNS(this.P, 'p:sldMasterId')
        entry.setAttribute(
          'id',
          String(
            Math.max(
              2147483647,
              ...all(d, 'sldMasterId').map((n) => Number(n.getAttribute('id')))
            ) + 1
          )
        )
        entry.setAttributeNS(
          this.R,
          'r:id',
          this.relation(this.presentation, copied, 'slideMaster')
        )
        list.appendChild(entry)
      }
  }
  private pictureMedia(n: any, part: string): any[] {
    const ids = ['media', 'videoFile', 'audioFile'].flatMap((name) =>
      all(n, name)
        .filter((v: any) =>
          name === 'media'
            ? v.namespaceURI ===
              'http://schemas.microsoft.com/office/powerpoint/2010/main'
            : v.namespaceURI === this.A
        )
        .map((v: any) => v.getAttribute('r:embed') || v.getAttribute('r:link'))
    )
    return this.relations(part).filter(
      (r) =>
        ids.includes(r.getAttribute('Id')) &&
        /\/(?:media|video|audio)$/.test(r.getAttribute('Type'))
    )
  }
  private apply(c: Command): CommandResult {
    if (c.type === 'image.crop' || c.type === 'resource.replace') {
      const n = this.element(c.ref)
      if (n.localName !== 'pic') throw Error('Expected picture')
      const fill = child(n, 'blipFill', this.P)
      if (c.type === 'image.crop') {
        if (!fill || this.pictureMedia(n, c.ref.part).length)
          throw Error('Expected image')
        let rect = child(fill, 'srcRect', this.A)
        if (!rect) {
          rect = n.ownerDocument.createElementNS(this.A, 'a:srcRect')
          fill.insertBefore(
            rect,
            child(fill, 'tile', this.A) ??
              child(fill, 'stretch', this.A) ??
              null
          )
        }
        for (const [key, attr] of [
          ['left', 'l'],
          ['right', 'r'],
          ['top', 't'],
          ['bottom', 'b'],
        ] as const)
          rect.setAttribute(attr, String(Math.round(c.crop[key] * 100000)))
      } else {
        const media = this.pictureMedia(n, c.ref.part)
        const id = first(n, 'blip')?.getAttribute('r:embed')
        const relations = media.length
          ? media
          : this.relations(c.ref.part).filter(
              (r) =>
                r.getAttribute('Id') === id &&
                r.getAttribute('Type').endsWith('/image')
            )
        if (
          !relations.length ||
          relations.some(
            (r) =>
              r.getAttribute('TargetMode') === 'External' ||
              !this.parts[path(c.ref.part, r.getAttribute('Target'))]
          )
        )
          throw Error('Missing internal resource')
        if (
          media.length
            ? !['audio/mpeg', 'video/mp4'].includes(c.mimeType)
            : !c.mimeType.startsWith('image/')
        )
          throw Error('Resource kind mismatch')
        if (
          media.length &&
          media.some(
            (r) =>
              (r.getAttribute('Type').endsWith('/video') &&
                c.mimeType !== 'video/mp4') ||
              (r.getAttribute('Type').endsWith('/audio') &&
                c.mimeType !== 'audio/mpeg')
          )
        )
          throw Error('Media type mismatch')
        const ext = (
          {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
            'audio/mpeg': 'mp3',
            'video/mp4': 'mp4',
          } as Record<string, string>
        )[c.mimeType]!
        let i = 1
        while (this.parts[`ppt/media/resource${i}.${ext}`]) i++
        const target = `ppt/media/resource${i}.${ext}`
        this.parts[target] = c.data.slice()
        const ct = this.edit('[Content_Types].xml'),
          override = ct.createElementNS(
            ct.documentElement.namespaceURI,
            'Override'
          )
        override.setAttribute('PartName', '/' + target)
        override.setAttribute('ContentType', c.mimeType)
        ct.documentElement.appendChild(override)
        const relDoc = this.edit(relpath(c.ref.part))
        // Isolate selected known references even when opaque XML also uses an ID.
        // Never rewrite a source relationship or unknown extension reference.
        const known = media.length
          ? ['media', 'videoFile', 'audioFile'].flatMap((name) =>
              all(n, name).filter((v) =>
                name === 'media'
                  ? v.namespaceURI ===
                    'http://schemas.microsoft.com/office/powerpoint/2010/main'
                  : v.namespaceURI === this.A
              )
            )
          : [child(fill, 'blip', this.A)].filter(Boolean)
        const used = new Set(
          this.relations(c.ref.part).map((r) => r.getAttribute('Id'))
        )
        for (const r of relations) {
          let index = 1
          while (used.has(`rId${index}`)) index++
          const newId = `rId${index}`
          used.add(newId)
          const replacement = relDoc.createElementNS(r.namespaceURI, r.nodeName)
          replacement.setAttribute('Id', newId)
          replacement.setAttribute('Type', r.getAttribute('Type'))
          replacement.setAttribute(
            'Target',
            this.relativeTarget(c.ref.part, target)
          )
          relDoc.documentElement.appendChild(replacement)
          for (const reference of known)
            for (const attr of ['embed', 'link'])
              if (
                reference.getAttributeNS(this.R, attr) === r.getAttribute('Id')
              )
                reference.setAttributeNS(this.R, `r:${attr}`, newId)
        }
      }
      return { changed: true, ref: c.ref }
    }
    if (c.type === 'placeholder.set') {
      const n = this.element(c.ref),
        d = n.ownerDocument,
        nv = kids(n).find((v) => v.localName === 'nvSpPr')
      if (!nv) throw new Error('Only shapes support placeholders')
      let properties = kids(nv).find((v) => v.localName === 'nvPr')
      if (!properties) {
        properties = d.createElementNS(this.P, 'p:nvPr')
        nv.appendChild(properties)
      }
      let ph = first(properties, 'ph')
      if (!ph) {
        ph = d.createElementNS(this.P, 'p:ph')
        properties.appendChild(ph)
      }
      ph.setAttribute('type', c.placeholderType)
      ph.setAttribute('idx', String(c.index))
      return { changed: true }
    }
    if (c.type === 'page.showMaster') {
      this.edit(c.part).documentElement.setAttribute(
        'showMasterSp',
        c.visible ? '1' : '0'
      )
      return { changed: true }
    }
    if (c.type === 'layout.reset') {
      const d = this.edit(c.part)
      for (const shape of all(d, 'sp'))
        if (first(shape, 'ph')) {
          const sp = kids(shape).find((n) => n.localName === 'spPr')
          if (sp)
            for (const ch of kids(sp))
              if (['xfrm', 'solidFill', 'noFill', 'ln'].includes(ch.localName))
                sp.removeChild(ch)
          for (const rp of all(shape, 'rPr')) {
            for (const attr of ['sz', 'b', 'i', 'u']) rp.removeAttribute(attr)
            for (const ch of kids(rp))
              if (['latin', 'ea', 'cs', 'solidFill'].includes(ch.localName))
                rp.removeChild(ch)
          }
        }
      return { changed: true }
    }
    if (c.type === 'master.duplicate' || c.type === 'layout.duplicate') {
      const root = this.doc(c.part).documentElement.localName
      if (root !== (c.type === 'master.duplicate' ? 'sldMaster' : 'sldLayout'))
        throw new Error('Incorrect template part type')
      const source = this.clone(),
        map = new Map<string, string>(),
        part = this.copyGraph(source, c.part, map)
      this.registerCopiedMasters(source, map)
      if (c.name) first(this.edit(part), 'cSld').setAttribute('name', c.name)
      return { changed: true, part }
    }
    if (c.type === 'slides.import') {
      const source = OfficeDocument.load(c.data),
        parts = c.slideParts ?? source.ordered(),
        map = new Map<string, string>()
      if (!parts.length) throw new Error('No slides selected')
      let last: string | undefined
      for (const sourcePart of parts) {
        if (!source.ordered().includes(sourcePart))
          throw new Error('Source slide not found')
        last = this.copyGraph(source, sourcePart, map)
        this.registerSlide(last)
      }
      this.registerCopiedMasters(source, map)
      return { changed: true, part: last }
    }
    if (c.type === 'object.add') {
      const d = this.edit(c.part),
        sp = first(d, 'spTree')
      if (!sp) throw Error('Page has no shape tree')
      const id =
        c.object.id ||
        String(
          Math.max(
            1,
            ...all(d, 'cNvPr').map((n) => Number(n.getAttribute('id')) || 0)
          ) + 1
        )
      if (all(d, 'cNvPr').some((n) => n.getAttribute('id') === id))
        throw Error('Duplicate object ID')
      const o = c.object
      let inner = ''
      if (o.kind === 'image') {
        if (!o.data?.length) throw Error('Image data required')
        const ext =
          o.mimeType === 'image/jpeg'
            ? 'jpg'
            : o.mimeType === 'image/svg+xml'
              ? 'svg'
              : o.mimeType === 'image/webp'
                ? 'webp'
                : o.mimeType === 'image/gif'
                  ? 'gif'
                  : 'png'
        let i = 1
        while (this.parts[`ppt/media/image${i}.${ext}`]) i++
        const media = `ppt/media/image${i}.${ext}`
        this.parts[media] = o.data.slice()
        const ct = this.edit('[Content_Types].xml'),
          def = ct.createElementNS(ct.documentElement.namespaceURI, 'Default')
        def.setAttribute('Extension', ext)
        def.setAttribute('ContentType', o.mimeType || 'image/png')
        if (
          !all(ct, 'Default').some((n) => n.getAttribute('Extension') === ext)
        )
          ct.documentElement.appendChild(def)
        const rid = this.relation(c.part, media, 'image')
        inner = `<p:pic><p:nvPicPr><p:cNvPr id="${esc(id)}" name="${esc(o.name || 'Image')}"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr/></p:pic>`
      } else
        inner = `<p:sp><p:nvSpPr><p:cNvPr id="${esc(id)}" name="${esc(o.name || o.kind)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:prstGeom prst="${esc(o.geometry || 'rect')}"><a:avLst/></a:prstGeom></p:spPr>${o.kind === 'text' || o.text !== undefined ? '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr/><a:t/></a:r></a:p></p:txBody>' : ''}</p:sp>`
      const node = d.importNode(
        xml(this.wrap('temp', inner)).documentElement.firstChild,
        true
      )
      sp.appendChild(node)
      const ref = { part: c.part, id }
      this.apply({
        type: 'object.update',
        ref,
        patch: { ...o.frame, fill: o.fill, stroke: o.stroke, style: o.style },
      })
      if (o.kind === 'text' || (o.kind === 'shape' && o.text !== undefined))
        this.apply({
          type: 'text.set',
          ref,
          text: o.text || '',
          style: o.style,
        })
      return { changed: true, ref }
    }
    if (c.type === 'diagram.text.set') {
      const frame = this.element(c.ref, false)
      const diagram = this.editableDiagram(frame, c.ref.part)
      const data = this.edit(diagram.data),
        drawing = this.edit(diagram.drawing)
      const matches = diagramNodes(data, drawing).filter(
        (node) => node.dataId === c.nodeId
      )
      const point = matches[0]?.point
      const body = point && child(point, 't', point.namespaceURI)
      if (!body || !matches.length) throw Error('Diagram text node not found')
      const cachedBodies = matches.map((match) => {
        const cachedBody = child(
          match.shape,
          'txBody',
          match.shape.namespaceURI
        )
        if (!cachedBody) throw Error('Diagram cached text body is missing')
        return cachedBody
      })
      this.writeTextBody(body, c.text)
      for (const cachedBody of cachedBodies)
        this.writeTextBody(cachedBody, c.text)
      return { changed: true, ref: c.ref }
    }
    if (c.type === 'text.set') {
      const n = this.element(c.ref)
      let body = child(n, 'txBody', this.P)
      if (!body && n.localName === 'sp' && n.namespaceURI === this.P) {
        body = n.ownerDocument.importNode(
          xml(
            this.wrap(
              'temp',
              '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>'
            )
          ).documentElement.firstChild,
          true
        ) as Element
        n.insertBefore(body, child(n, 'extLst', this.P) ?? null)
      }
      if (!body) throw Error('Object is not text')
      this.writeTextBody(body, c.text)
      if (c.style) this.style(n, c.style)
      return { changed: true, ref: c.ref }
    }
    if (c.type === 'object.update') {
      const n = this.element(c.ref),
        d = n.ownerDocument
      const table = this.table(n)
      if (
        this.diagramParts(n, c.ref.part) &&
        (c.patch.width !== undefined || c.patch.height !== undefined)
      ) {
        const diagram = this.editableDiagram(n, c.ref.part)
        const ext = child(first(n, 'xfrm'), 'ext', this.A),
          tx = this.parentTransform(n)
        const oldWidth = Number(ext?.getAttribute('cx')) / E,
          oldHeight = Number(ext?.getAttribute('cy')) / E
        const sx =
          c.patch.width === undefined ? 1 : c.patch.width / tx.sx / oldWidth
        const sy =
          c.patch.height === undefined ? 1 : c.patch.height / tx.sy / oldHeight
        if (![sx, sy].every((value) => Number.isFinite(value) && value > 0))
          throw Error('Invalid diagram size')
        const drawing = this.edit(diagram.drawing)
        for (const element of all(drawing, 'off').concat(all(drawing, 'ext'))) {
          if (element.namespaceURI !== this.A) continue
          for (const [attribute, scale] of [
            ['x', sx],
            ['cx', sx],
            ['y', sy],
            ['cy', sy],
          ] as const)
            if (element.hasAttribute(attribute))
              element.setAttribute(
                attribute,
                String(
                  Math.round(Number(element.getAttribute(attribute)) * scale)
                )
              )
        }
        for (const element of all(drawing, 'rPr').concat(
          all(drawing, 'defRPr'),
          all(drawing, 'endParaRPr')
        ))
          if (element.hasAttribute('sz'))
            element.setAttribute(
              'sz',
              String(
                Math.max(
                  100,
                  Math.round(
                    Number(element.getAttribute('sz')) * Math.min(sx, sy)
                  )
                )
              )
            )
      }
      if (
        table &&
        (c.patch.fill !== undefined ||
          c.patch.stroke !== undefined ||
          c.patch.style !== undefined)
      )
        throw Error('Table object styling unsupported')
      const sp = table ? n : first(n, 'spPr') || first(n, 'xfrm')?.parentNode
      if (!sp) throw Error('Object transform unsupported')
      if (
        ['x', 'y', 'width', 'height', 'rotation'].some(
          (key) => (c.patch as any)[key] !== undefined
        )
      ) {
        const patch = { ...c.patch }
        const tx = this.parentTransform(n)
        if (patch.x !== undefined) patch.x = (patch.x - tx.x) / tx.sx
        if (patch.y !== undefined) patch.y = (patch.y - tx.y) / tx.sy
        if (patch.width !== undefined) patch.width /= tx.sx
        if (patch.height !== undefined) patch.height /= tx.sy
        const current = this.sceneFor(c.ref.part)
        const existing = [
          ...current.slides,
          ...current.masters,
          ...current.layouts,
        ]
          .find((p) => p.part === c.ref.part)
          ?.objects.find((o) => o.id === c.ref.id && !o.inherited)
        let xf = table ? child(n, 'xfrm', this.P) : first(sp, 'xfrm')
        if (!xf) {
          if (table) {
            xf = d.createElementNS(this.P, 'p:xfrm')
            n.insertBefore(xf, child(n, 'graphic', this.A))
          } else {
            xf = d.createElementNS(this.A, 'a:xfrm')
            sp.insertBefore(xf, sp.firstChild)
          }
        }
        for (const [tag, keys, attrs] of [
          ['off', ['x', 'y'], ['x', 'y']],
          ['ext', ['width', 'height'], ['cx', 'cy']],
        ] as const) {
          let el = table ? child(xf, tag, this.A) : first(xf, tag)
          if (!el) {
            el = d.createElementNS(this.A, 'a:' + tag)
            xf.appendChild(el)
          }
          keys.forEach((key, i) => {
            const val =
              patch[key] ??
              (existing
                ? key === 'x'
                  ? (existing.x - tx.x) / tx.sx
                  : key === 'y'
                    ? (existing.y - tx.y) / tx.sy
                    : key === 'width'
                      ? existing.width / tx.sx
                      : existing.height / tx.sy
                : undefined)
            if (val !== undefined) {
              if (!Number.isFinite(val) || (tag === 'ext' && val < 0))
                throw Error('Invalid frame')
              el.setAttribute(attrs[i], String(Math.round(val * E)))
            } else if (!el.hasAttribute(attrs[i]))
              el.setAttribute(attrs[i], '0')
          })
        }
        if (table && patch.width !== undefined) {
          const columns = kids(child(table, 'tblGrid', this.A)).filter(
            (node) =>
              node.namespaceURI === this.A && node.localName === 'gridCol'
          )
          this.resizeTableAxis(columns, 'w', Math.round(patch.width * E))
        }
        if (table && patch.height !== undefined) {
          const rows = kids(table).filter(
            (node) => node.namespaceURI === this.A && node.localName === 'tr'
          )
          this.resizeTableAxis(rows, 'h', Math.round(patch.height * E))
        }
        if (c.patch.rotation !== undefined)
          xf.setAttribute(
            'rot',
            String(
              table
                ? Math.round((c.patch.rotation % 360) * 60000)
                : c.patch.rotation * 60000
            )
          )
      }
      for (const key of ['fill', 'stroke'] as const)
        if (c.patch[key] !== undefined) {
          let parent = sp
          if (key === 'stroke') {
            parent = first(sp, 'ln')
            if (!parent) {
              parent = d.createElementNS(this.A, 'a:ln')
              sp.insertBefore(
                parent,
                kids(sp).find((n) =>
                  [
                    'effectLst',
                    'effectDag',
                    'scene3d',
                    'sp3d',
                    'extLst',
                  ].includes(n.localName)
                ) ?? null
              )
            }
          }
          for (const ch of kids(parent).filter(
            (x) =>
              x.namespaceURI === this.A && fillChoices.includes(x.localName)
          ))
            parent.removeChild(ch)
          const fillNode = d.importNode(
            xml(
              `<a:solidFill xmlns:a="${this.A}"><a:srgbClr val="${c.patch[key]!.replace('#', '')}"/></a:solidFill>`
            ).documentElement,
            true
          )
          parent.insertBefore(
            fillNode,
            kids(parent).find((n) =>
              key === 'stroke'
                ? !['noFill', 'solidFill', 'gradFill', 'pattFill'].includes(
                    n.localName
                  )
                : [
                    'ln',
                    'effectLst',
                    'effectDag',
                    'scene3d',
                    'sp3d',
                    'extLst',
                  ].includes(n.localName)
            ) ?? null
          )
        }
      if (c.patch.style) this.style(n, c.patch.style)
      return { changed: true }
    }
    if (c.type === 'object.delete') {
      const n = this.element(c.ref)
      n.parentNode.removeChild(n)
      return { changed: true }
    }
    if (c.type === 'object.reorder') {
      const n = this.element(c.ref),
        parent = n.parentNode
      const siblings = kids(parent).filter(
        (x) => !['nvGrpSpPr', 'grpSpPr'].includes(x.localName)
      )
      const i = siblings.indexOf(n)
      if (c.direction === 'front') parent.appendChild(n)
      else if (c.direction === 'back') parent.insertBefore(n, siblings[0])
      else if (c.direction === 'forward' && i < siblings.length - 1)
        parent.insertBefore(siblings[i + 1], n)
      else if (c.direction === 'backward' && i > 0)
        parent.insertBefore(n, siblings[i - 1])
      return { changed: true }
    }
    if (
      c.type === 'master.add' ||
      c.type === 'layout.add' ||
      c.type === 'slide.add'
    ) {
      const type = c.type.split('.')[0]!,
        part = this.next(
          type === 'master'
            ? 'slideMasters'
            : type === 'layout'
              ? 'slideLayouts'
              : 'slides',
          type === 'master'
            ? 'slideMaster'
            : type === 'layout'
              ? 'slideLayout'
              : 'slide'
        )
      this.put(
        part,
        this.wrap(
          type === 'master'
            ? 'sldMaster'
            : type === 'layout'
              ? 'sldLayout'
              : 'sld',
          `<p:cSld name="${esc(c.name || type)}">${tree}</p:cSld>${type === 'master' ? '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst/>' : '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>'}`
        )
      )
      this.content(
        part,
        type === 'master'
          ? 'slideMaster'
          : type === 'layout'
            ? 'slideLayout'
            : 'slide'
      )
      if (c.type === 'master.add') {
        const rid = this.relation(this.presentation, part, 'slideMaster')
        const d = this.edit(this.presentation),
          list = first(d, 'sldMasterIdLst')
        const n = d.createElementNS(this.P, 'p:sldMasterId')
        n.setAttribute(
          'id',
          String(
            Math.max(
              2147483647,
              ...all(d, 'sldMasterId').map((n) => Number(n.getAttribute('id')))
            ) + 1
          )
        )
        n.setAttributeNS(this.R, 'r:id', rid)
        list.appendChild(n)
        const theme = all(this.doc('[Content_Types].xml'), 'Override')
          .find(
            (n) =>
              n.getAttribute('ContentType') ===
              'application/vnd.openxmlformats-officedocument.theme+xml'
          )
          ?.getAttribute('PartName')
          ?.replace(/^\//, '')
        if (theme) this.relation(part, theme, 'theme')
        else {
          const template = OfficeDocument.create()
          const copied = this.copyGraph(
            template,
            'ppt/theme/theme1.xml',
            new Map()
          )
          this.relation(part, copied, 'theme')
        }
      } else if (c.type === 'layout.add') {
        this.doc(c.masterPart)
        this.relation(part, c.masterPart, 'slideMaster')
        const rid = this.relation(c.masterPart, part, 'slideLayout'),
          md = this.edit(c.masterPart),
          list = first(md, 'sldLayoutIdLst')
        const n = md.createElementNS(this.P, 'p:sldLayoutId')
        n.setAttribute(
          'id',
          String(
            Math.max(
              2147483648,
              ...all(md, 'sldLayoutId').map((n) => Number(n.getAttribute('id')))
            ) + 1
          )
        )
        n.setAttributeNS(this.R, 'r:id', rid)
        list.appendChild(n)
      } else {
        const layout =
          c.layoutPart ||
          this.relatedParts(this.presentation, 'slideMaster').flatMap((m) =>
            this.relatedParts(m, 'slideLayout')
          )[0]
        if (layout) {
          this.doc(layout)
          this.relation(part, layout, 'slideLayout')
        }
        const rid = this.relation(this.presentation, part, 'slide')
        const d = this.edit(this.presentation),
          list = first(d, 'sldIdLst'),
          n = d.createElementNS(this.P, 'p:sldId')
        n.setAttribute(
          'id',
          String(
            Math.max(
              255,
              ...all(d, 'sldId').map((x) => Number(x.getAttribute('id')))
            ) + 1
          )
        )
        n.setAttributeNS(this.R, 'r:id', rid)
        const ordered = this.ordered(),
          index = c.after ? ordered.indexOf(c.after) : -1
        if (index >= 0) list.insertBefore(n, kids(list)[index + 1] || null)
        else list.appendChild(n)
      }
      return { changed: true, part }
    }
    if (c.type === 'slide.duplicate') {
      if (!this.ordered().includes(c.part))
        throw new Error('Source slide not found')
      const source = this.clone(),
        map = new Map<string, string>(
          [...source.getScene().masters, ...source.getScene().layouts].map(
            (p) => [p.part, p.part]
          )
        ),
        newPart = this.copyGraph(source, c.part, map)
      this.registerSlide(newPart)
      this.registerCopiedMasters(source, map)
      this.apply({
        type: 'slide.move',
        part: newPart,
        index: this.ordered().indexOf(c.part) + 1,
      })
      return { changed: true, part: newPart }
    }
    if (c.type === 'slide.move' || c.type === 'slide.delete') {
      const index = this.ordered().indexOf(c.part)
      if (index < 0) throw Error('Slide not found')
      const d = this.edit(this.presentation),
        list = first(d, 'sldIdLst'),
        n = kids(list)[index]
      list.removeChild(n)
      if (c.type === 'slide.move') {
        if (
          !Number.isInteger(c.index) ||
          c.index < 0 ||
          c.index > kids(list).length
        )
          throw Error('Invalid slide index')
        list.insertBefore(n, kids(list)[c.index] || null)
      } else {
        const rp = relpath(this.presentation),
          rd = this.edit(rp),
          id = n.getAttribute('r:id')
        const r = all(rd, 'Relationship').find(
          (x) => x.getAttribute('Id') === id
        )
        if (r) r.parentNode.removeChild(r)
        for (const p of [c.part, relpath(c.part)]) {
          delete this.parts[p]
          this.docs.delete(p)
          this.dirty.delete(p)
        }
        const ct = this.edit('[Content_Types].xml')
        for (const entry of all(ct, 'Override'))
          if (entry.getAttribute('PartName') === '/' + c.part)
            entry.parentNode.removeChild(entry)
      }
      return { changed: true }
    }
    if (c.type === 'page.rename') {
      first(this.edit(c.part), 'cSld').setAttribute('name', c.name)
      return { changed: true }
    }
    if (c.type === 'page.background') {
      const d = this.edit(c.part),
        cs = first(d, 'cSld')
      let bg = first(cs, 'bg')
      if (bg) cs.removeChild(bg)
      bg = d.importNode(
        xml(
          this.wrap(
            'bg',
            `<p:bgPr><a:solidFill><a:srgbClr val="${esc(c.color.replace('#', ''))}"/></a:solidFill><a:effectLst/></p:bgPr>`
          )
        ).documentElement,
        true
      )
      cs.insertBefore(bg, cs.firstChild)
      return { changed: true }
    }
    if (c.type === 'layout.apply') {
      this.doc(c.layoutPart)
      const old = this.relations(c.part).find((r) =>
        r.getAttribute('Type').endsWith('/slideLayout')
      )
      if (old) {
        this.edit(relpath(c.part))
        old.parentNode.removeChild(old)
      }
      this.relation(c.part, c.layoutPart, 'slideLayout')
      return { changed: true }
    }
    if (c.type === 'theme.update') {
      const targets = c.part
        ? [c.part]
        : [
            ...new Set(
              [
                this.presentation,
                ...this.ordered(),
                ...this.relatedParts(this.presentation, 'slideMaster'),
                ...this.relatedParts(this.presentation, 'slideMaster').flatMap(
                  (m) => this.relatedParts(m, 'slideLayout')
                ),
              ].flatMap((p) => this.relatedParts(p, 'theme'))
            ),
          ]
      for (const p of targets) {
        const d = this.edit(p)
        for (const [key, value] of Object.entries(c.colors || {})) {
          const color = first(first(d, 'clrScheme'), key)
          if (!color) throw Error('Unknown theme color')
          color.textContent = ''
          color.appendChild(
            d.importNode(
              xml(
                `<a:srgbClr xmlns:a="${this.A}" val="${esc(value.replace('#', ''))}"/>`
              ).documentElement,
              true
            )
          )
        }
        if (c.fontFamily)
          for (const n of all(d, 'latin'))
            n.setAttribute('typeface', c.fontFamily)
      }
      return { changed: true }
    }
    if (c.type === 'table.add') {
      const d = this.edit(c.part),
        sp = child(child(d.documentElement, 'cSld', this.P), 'spTree', this.P)
      if (!sp) throw Error('Page has no shape tree')
      const id =
        descendants(d, 'cNvPr', this.P).reduce(
          (maximum, node) =>
            Math.max(maximum, Number(node.getAttribute('id')) || 0),
          1
        ) + 1
      if (id > 4294967295) throw Error('No table object ID available')
      const { x, y, width, height, rotation } = c.frame
      const columns = c.cells[0]!.length
      const cx = Math.round(width * E),
        cy = Math.round(height * E)
      if (cx < columns || cy < c.cells.length)
        throw Error('Table frame is too small')
      // Split whole EMUs so the grid and frame extents agree exactly.
      const extent = (total: number, count: number, index: number) =>
        Math.floor(total / count) + Number(index < total % count)
      const grid = c.cells[0]!.map(
        (_, i) => `<a:gridCol w="${extent(cx, columns, i)}"/>`
      ).join('')
      const rows = c.cells
        .map(
          (row, i) =>
            `<a:tr h="${extent(cy, c.cells.length, i)}">${row
              .map(() => blankTableCell)
              .join('')}</a:tr>`
        )
        .join('')
      const rot =
        rotation === undefined
          ? ''
          : ` rot="${Math.round((rotation % 360) * 60000)}"`
      const frame = d.importNode(
        xml(
          this.wrap(
            'graphicFrame',
            `<p:nvGraphicFramePr><p:cNvPr id="${id}" name="${esc(c.name || 'Table')}"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>` +
              `<p:xfrm${rot}><a:off x="${Math.round(x * E)}" y="${Math.round(y * E)}"/><a:ext cx="${cx}" cy="${cy}"/></p:xfrm>` +
              `<a:graphic><a:graphicData uri="${this.tableUri}"><a:tbl><a:tblGrid>${grid}</a:tblGrid>${rows}</a:tbl></a:graphicData></a:graphic>`
          )
        ).documentElement,
        true
      )
      this.tableRows(this.table(frame)).forEach((row, i) =>
        row.forEach((cell, j) => {
          const text = c.cells[i]![j]!
          if (text) this.writeTextBody(child(cell, 'txBody', this.A), text)
        })
      )
      sp.insertBefore(frame, child(sp, 'extLst', this.P) ?? null)
      return { changed: true, ref: { part: c.part, id: String(id) } }
    }
    if (c.type === 'table.structure') {
      const frame = this.element(c.ref, false)
      const table = this.table(frame)
      if (!table) throw Error('Object is not a table')
      const drawingChildren = (node: any, name: string) =>
        kids(node).filter(
          (item) => item.namespaceURI === this.A && item.localName === name
        )
      const grids = drawingChildren(table, 'tblGrid')
      const grid = grids[0]
      const columns = grid ? drawingChildren(grid, 'gridCol') : []
      const rows = drawingChildren(table, 'tr')
      const cells = this.tableRows(table)
      if (
        grids.length !== 1 ||
        !rows.length ||
        !columns.length ||
        cells.some((row) => row.length !== columns.length)
      )
        throw Error('Invalid table grid')
      if (cells.some((row) => row.some(isMergedTableCell)))
        throw Error('Merged table structure editing unsupported')

      const { axis, action, index } = c
      const isRow = axis === 'row'
      const members = isRow ? rows : columns
      const insert = action === 'insert'
      if (index >= members.length + Number(insert))
        throw Error('Table structure index out of bounds')
      if (!insert && members.length === 1)
        throw Error('Cannot delete the final table row or column')
      if (insert && members.length >= (isRow ? 100 : 50))
        throw Error('Table structure limit exceeded')

      for (const row of rows) requireTableExtent(row, 'h')
      for (const column of columns) requireTableExtent(column, 'w')
      const ext = child(child(frame, 'xfrm', this.P), 'ext', this.A)
      const width = requireTableExtent(ext, 'cx')
      const height = requireTableExtent(ext, 'cy')
      const attribute = isRow ? 'h' : 'w'
      const extent = isRow ? height : width
      const d = this.edit(c.ref.part)
      const newCell =
        insert && !isRow
          ? xml(`<a:tc xmlns:a="${this.A}">${blankTableCellBody}</a:tc>`)
              .documentElement
          : null
      const editMembers = (parent: any, siblings: any[], newNode?: any) => {
        if (insert) {
          // At the end of a row, insert before its trailing extension list.
          const before = siblings[index] ?? siblings.at(-1).nextSibling
          parent.insertBefore(newNode, before)
          siblings.splice(index, 0, newNode)
        } else {
          parent.removeChild(siblings[index])
          siblings.splice(index, 1)
        }
      }
      let newMember
      if (insert) {
        const size = Number(
          members[Math.max(0, index - 1)].getAttribute(attribute)
        )
        newMember = d.importNode(
          xml(
            isRow
              ? `<a:tr xmlns:a="${this.A}" h="${size}">${blankTableCell.repeat(columns.length)}</a:tr>`
              : `<a:gridCol xmlns:a="${this.A}" w="${size}"/>`
          ).documentElement,
          true
        )
      }
      editMembers(isRow ? table : grid, members, newMember)
      if (!isRow)
        rows.forEach((row, i) =>
          editMembers(
            row,
            cells[i]!,
            newCell ? d.importNode(newCell, true) : undefined
          )
        )
      this.resizeTableAxis(members, attribute, extent)
      return { changed: true, ref: c.ref }
    }
    if (c.type === 'table.set') {
      const table = this.table(this.element(c.ref, false))
      if (!table) throw Error('Object is not a table')
      const rows = this.tableRows(table)
      const metadata = this.tableMetadata(table, c.ref.part)
      if (
        rows.length !== c.cells.length ||
        rows.some((row, i) => row.length !== c.cells[i]!.length)
      )
        throw Error('Table resize unsupported')
      let changed = false
      rows.forEach((row, i) =>
        row.forEach((cell, j) => {
          const text = c.cells[i]![j]!.replace(/\r\n?/g, '\n')
          let body = child(cell, 'txBody', this.A)
          if (this.readTextBody(body) === text) return
          if (!metadata.valid || metadata.cells[i]?.[j]?.mergedInto)
            throw Error('Merged table cell editing unsupported')
          if (!body) {
            const d = cell.ownerDocument
            body = d.createElementNS(this.A, 'a:txBody')
            body.appendChild(d.createElementNS(this.A, 'a:bodyPr'))
            cell.insertBefore(body, cell.firstChild)
          }
          this.edit(c.ref.part)
          this.writeTextBody(body, text)
          changed = true
        })
      )
      return { changed, ref: c.ref }
    }
    if (c.type === 'layout.delete' || c.type === 'master.delete') {
      this.doc(c.part)
      if (c.replacementPart === c.part) throw Error('Replacement must differ')
      if (c.replacementPart) this.doc(c.replacementPart)
      const relationType =
        c.type === 'layout.delete' ? 'slideLayout' : 'slideMaster'
      const references = Object.keys(this.parts)
        .filter((p) => p.endsWith('.xml') && !p.includes('/_rels/'))
        .flatMap((p) =>
          this.relations(p)
            .filter(
              (r) =>
                r.getAttribute('TargetMode') !== 'External' &&
                path(p, r.getAttribute('Target')) === c.part
            )
            .map((r) => ({ p, r }))
        )
      const dependents = references.filter(
        ({ p, r }) =>
          r.getAttribute('Type').endsWith('/' + relationType) &&
          p !== this.presentation &&
          this.doc(p).documentElement.localName !== 'sldMaster'
      )
      if (dependents.length && !c.replacementPart)
        throw Error('Referenced page requires replacement')
      if (c.replacementPart) {
        const expected = c.type === 'layout.delete' ? 'sldLayout' : 'sldMaster'
        if (this.doc(c.replacementPart).documentElement.localName !== expected)
          throw Error('Invalid replacement type')
      }
      if (c.type === 'master.delete' && c.replacementPart)
        for (const { p } of dependents) {
          const md = this.edit(c.replacementPart),
            list = first(md, 'sldLayoutIdLst'),
            rid = this.relation(c.replacementPart, p, 'slideLayout'),
            n = md.createElementNS(this.P, 'p:sldLayoutId')
          n.setAttribute(
            'id',
            String(
              Math.max(
                2147483648,
                ...all(md, 'sldLayoutId').map((n) =>
                  Number(n.getAttribute('id'))
                )
              ) + 1
            )
          )
          n.setAttributeNS(this.R, 'r:id', rid)
          list.appendChild(n)
        }
      for (const { p, r } of references) {
        this.edit(relpath(p))
        const id = r.getAttribute('Id')
        r.parentNode.removeChild(r)
        if (dependents.some((x) => x.r === r) && c.replacementPart)
          this.relation(p, c.replacementPart, relationType)
        else {
          const d = this.edit(p)
          for (const n of [...all(d, 'sldLayoutId'), ...all(d, 'sldMasterId')])
            if (
              (n.getAttribute('r:id') || n.getAttributeNS(this.R, 'id')) === id
            )
              n.parentNode.removeChild(n)
        }
      }
      for (const p of [c.part, relpath(c.part)]) {
        delete this.parts[p]
        this.docs.delete(p)
        this.dirty.delete(p)
      }
      const ct = this.edit('[Content_Types].xml')
      for (const n of all(ct, 'Override'))
        if (n.getAttribute('PartName') === '/' + c.part)
          n.parentNode.removeChild(n)
      return { changed: true }
    }
    throw Error(`Unsupported command ${(c as { type: string }).type}`)
  }
}
