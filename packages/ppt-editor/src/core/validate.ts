import type { Command } from '../types.js'
const commands = new Set([
  'diagram.text.set',
  'image.crop',
  'resource.replace',
  'object.add',
  'object.update',
  'text.set',
  'object.delete',
  'object.reorder',
  'slide.add',
  'slide.delete',
  'slide.duplicate',
  'slide.move',
  'page.background',
  'layout.apply',
  'theme.update',
  'page.rename',
  'master.add',
  'layout.add',
  'master.delete',
  'layout.delete',
  'table.add',
  'table.set',
  'table.structure',
  'master.duplicate',
  'layout.duplicate',
  'placeholder.set',
  'layout.reset',
  'page.showMaster',
  'slides.import',
])
/** Validate public commands at the shared browser/server boundary before an XML transaction. */
export function validateCommand(command: Command): void {
  if (!command || !commands.has(command.type))
    throw new Error('Unknown command')
  if (
    command.type === 'diagram.text.set' &&
    (typeof command.nodeId !== 'string' ||
      !command.nodeId ||
      typeof command.text !== 'string')
  )
    throw new Error('Invalid diagram text command')
  if (
    command.type === 'table.structure' &&
    (!['row', 'column'].includes(command.axis) ||
      !['insert', 'delete'].includes(command.action) ||
      !Number.isInteger(command.index) ||
      command.index < 0)
  )
    throw new Error('Invalid table structure command')
  if (command.type === 'table.add' || command.type === 'table.set') {
    const cells = command.cells
    if (
      !Array.isArray(cells) ||
      !cells.length ||
      (command.type === 'table.add' && cells.length > 100) ||
      !Array.from(cells).every(
        (row) =>
          Array.isArray(row) &&
          row.length > 0 &&
          (command.type === 'table.set' ||
            (row.length <= 50 && row.length === cells[0]?.length)) &&
          Array.from(row).every((cell) => typeof cell === 'string')
      )
    )
      throw new Error('Invalid table cells')
  }
  if (command.type === 'table.add') {
    const { frame } = command
    if (
      !frame ||
      ['x', 'y', 'width', 'height'].some(
        (key) => typeof frame[key as keyof typeof frame] !== 'number'
      ) ||
      frame.width <= 0 ||
      frame.height <= 0 ||
      (frame.rotation !== undefined && typeof frame.rotation !== 'number') ||
      (command.name !== undefined && typeof command.name !== 'string')
    )
      throw new Error('Invalid table frame or name')
  }
  if (command.type === 'image.crop') {
    const c = command.crop
    if (
      !c ||
      !['left', 'right', 'top', 'bottom'].every(
        (k) =>
          typeof c[k as keyof typeof c] === 'number' &&
          Number.isFinite(c[k as keyof typeof c]) &&
          Math.abs(c[k as keyof typeof c]) <= 10
      ) ||
      c.left + c.right >= 1 ||
      c.top + c.bottom >= 1
    )
      throw Error('Invalid image crop')
  }
  if (command.type === 'resource.replace')
    validateAsset(command.data, command.mimeType)
  const visit = (value: unknown, key = '') => {
    if (key === 'ref') {
      const ref = value as { part?: unknown; id?: unknown } | undefined
      if (
        !ref ||
        typeof ref.part !== 'string' ||
        typeof ref.id !== 'string' ||
        !ref.id
      )
        throw new Error('Invalid object reference')
      visit(ref.part, 'part')
      visit(ref.id, 'id')
      return
    }
    if (typeof value === 'string') {
      if (
        value.length > 1_000_000 ||
        // XML 1.0 forbids these control characters; reject them before serialization.
        // eslint-disable-next-line no-control-regex
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
      )
        throw new Error('Invalid text')
      if (
        ['fill', 'stroke', 'color'].includes(key) &&
        !/^#[\da-f]{6}$/i.test(value)
      )
        throw new Error('Invalid color; use #RRGGBB')
      if (
        [
          'part',
          'layoutPart',
          'masterPart',
          'replacementPart',
          'after',
        ].includes(key) &&
        (!value ||
          value.startsWith('/') ||
          value.includes('\\') ||
          value.split('/').includes('..'))
      )
        throw new Error('Invalid part path')
    } else if (
      typeof value === 'number' &&
      (!Number.isFinite(value) || Math.abs(value) > 1e9)
    )
      throw new Error('Invalid numeric value')
    else if (
      value &&
      typeof value === 'object' &&
      !(value instanceof Uint8Array)
    ) {
      for (const [name, child] of Object.entries(value)) visit(child, name)
    }
  }
  visit(command)
  if (
    command.type === 'placeholder.set' &&
    (![
      'title',
      'body',
      'ctrTitle',
      'subTitle',
      'dt',
      'sldNum',
      'ftr',
      'hdr',
      'obj',
      'chart',
      'tbl',
      'clipArt',
      'dgm',
      'media',
      'sldImg',
      'pic',
    ].includes(command.placeholderType) ||
      !Number.isInteger(command.index) ||
      command.index < 0)
  )
    throw new Error('Invalid placeholder')
  if (command.type === 'object.add') {
    const o = command.object
    if (!o || !['shape', 'text', 'image'].includes(o.kind) || !o.frame)
      throw new Error('Invalid object')
    if (
      o.id !== undefined &&
      (!/^\d+$/.test(o.id) || Number(o.id) < 1 || Number(o.id) > 4294967295)
    )
      throw new Error('Invalid shape ID')
    if (
      o.geometry &&
      ![
        'rect',
        'roundRect',
        'ellipse',
        'triangle',
        'diamond',
        'line',
        'chevron',
        'pentagon',
        'hexagon',
        'star5',
        'rightArrow',
        'leftArrow',
      ].includes(o.geometry)
    )
      throw new Error('Unsupported shape geometry')
    for (const k of ['x', 'y', 'width', 'height'] as const)
      if (typeof o.frame[k] !== 'number') throw new Error('Invalid frame')
  }
  if (command.type === 'object.update' && !command.patch)
    throw new Error('Missing object patch')
  if (command.type === 'text.set' && typeof command.text !== 'string')
    throw new Error('Invalid text value')
  if (command.type === 'theme.update')
    for (const color of Object.values(command.colors ?? {}))
      if (!/^#[\da-f]{6}$/i.test(color)) throw new Error('Invalid theme color')
}

/** Conservative byte signatures shared by replacement command paths. */
export function validateAsset(data: Uint8Array, mime: string): void {
  if (
    !(data instanceof Uint8Array) ||
    !data.length ||
    data.length > 100_000_000
  )
    throw Error('Invalid asset bytes')
  const starts = (...bytes: number[]) => bytes.every((b, i) => data[i] === b)
  const ascii = (a: number, b: number) =>
    String.fromCharCode(...data.subarray(a, b))
  const valid =
    mime === 'image/png'
      ? starts(137, 80, 78, 71, 13, 10, 26, 10)
      : mime === 'image/jpeg'
        ? starts(255, 216, 255)
        : mime === 'image/gif'
          ? ['GIF87a', 'GIF89a'].includes(ascii(0, 6))
          : mime === 'image/webp'
            ? ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
            : mime === 'video/mp4'
              ? data.length >= 16 &&
                ascii(4, 8) === 'ftyp' &&
                ['isom', 'iso2', 'mp41', 'mp42', 'avc1', 'M4V '].includes(
                  ascii(8, 12)
                )
              : mime === 'audio/mpeg'
                ? (data.length >= 10 &&
                    ascii(0, 3) === 'ID3' &&
                    [2, 3, 4].includes(data[3]!) &&
                    data.subarray(6, 10).every((v) => v < 128)) ||
                  (data.length >= 4 &&
                    data[0] === 255 &&
                    (data[1]! & 224) === 224 &&
                    (data[1]! & 24) !== 8 &&
                    (data[1]! & 6) !== 0 &&
                    (data[2]! & 240) !== 0 &&
                    (data[2]! & 240) !== 240 &&
                    (data[2]! & 12) !== 12)
                : mime === 'image/svg+xml'
                  ? (() => {
                      const text = new TextDecoder().decode(data)
                      return (
                        /^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(text) &&
                        !/<(?:[\w.-]+:)?(?:script|foreignObject|style)|\bstyle\s*=|@import|url\s*\(|<\?xml-stylesheet|\bon\w+\s*=|(?:href|src)\s*=\s*['"](?!#)|<!DOCTYPE|<!ENTITY/i.test(
                          text
                        )
                      )
                    })()
                  : false
  if (!valid) throw Error('Unsupported asset MIME or byte signature')
}
