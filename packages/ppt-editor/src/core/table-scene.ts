import type { TableCellScene, TextStyle } from '../types.js'
const children = (node: any, ns: string, name?: string): any[] =>
  Array.from(node?.childNodes ?? []).filter(
    (n: any) =>
      n.nodeType === 1 &&
      n.namespaceURI === ns &&
      (!name || n.localName === name)
  )
const child = (node: any, ns: string, name: string) =>
  children(node, ns, name)[0]
const on = (node: any, name: string) =>
  ['1', 'true', 'on'].includes(node?.getAttribute(name))
export function readTableCells(
  table: any,
  ns: string,
  color: (n: any) => string | undefined,
  textStyle: (run: any, paragraph: any) => TextStyle,
  tableStyle?: any
) {
  const rows = children(table, ns, 'tr').map((row) => children(row, ns, 'tc'))
  const count = children(child(table, ns, 'tblGrid'), ns, 'gridCol').length
  const cells: TableCellScene[][] = rows.map((row) =>
    row.map(() => ({
      rowSpan: 1,
      columnSpan: 1,
      style: { fontSize: 24 },
      verticalAlign: 'top',
      margins: { left: 9.6, right: 9.6, top: 4.8, bottom: 4.8 },
    }))
  )
  let valid = count > 0 && rows.every((row) => row.length === count)
  const props = child(table, ns, 'tblPr')
  rows.forEach((row, r) =>
    row.forEach((cell, c) => {
      const result = cells[r]![c]!
      const horizontal = on(cell, 'hMerge'),
        vertical = on(cell, 'vMerge')
      if (horizontal || vertical) {
        if (!result.mergedInto) valid = false
      } else {
        if (result.mergedInto) valid = false
        const rs = Number(cell.getAttribute('rowSpan') || 1),
          cs = Number(cell.getAttribute('gridSpan') || 1)
        if (
          !Number.isSafeInteger(rs) ||
          !Number.isSafeInteger(cs) ||
          rs < 1 ||
          cs < 1 ||
          r + rs > rows.length ||
          c + cs > count
        )
          valid = false
        else {
          result.rowSpan = rs
          result.columnSpan = cs
          for (let y = r; y < r + rs; y++)
            for (let x = c; x < c + cs; x++) {
              if (y === r && x === c) continue
              const covered = cells[y]?.[x],
                source = rows[y]?.[x]
              if (
                !covered ||
                covered.mergedInto ||
                (x > c && !on(source, 'hMerge')) ||
                (y > r && !on(source, 'vMerge'))
              )
                valid = false
              else covered.mergedInto = { row: r, column: c }
            }
        }
      }
      const styleNames = ['wholeTbl']
      if (on(props, 'bandCol'))
        styleNames.push(
          (c - Number(on(props, 'firstCol')) + 2) % 2 === 0
            ? 'band1V'
            : 'band2V'
        )
      if (on(props, 'bandRow'))
        styleNames.push(
          (r - Number(on(props, 'firstRow')) + 2) % 2 === 0
            ? 'band1H'
            : 'band2H'
        )
      if (c === 0 && on(props, 'firstCol')) styleNames.push('firstCol')
      if (c + result.columnSpan === count && on(props, 'lastCol'))
        styleNames.push('lastCol')
      if (r === 0 && on(props, 'firstRow')) styleNames.push('firstRow')
      if (r + result.rowSpan === rows.length && on(props, 'lastRow'))
        styleNames.push('lastRow')
      if (r === 0 && on(props, 'firstRow')) {
        if (c === 0 && on(props, 'firstCol')) styleNames.push('nwCell')
        if (c + result.columnSpan === count && on(props, 'lastCol'))
          styleNames.push('neCell')
      }
      if (r + result.rowSpan === rows.length && on(props, 'lastRow')) {
        if (c === 0 && on(props, 'firstCol')) styleNames.push('swCell')
        if (c + result.columnSpan === count && on(props, 'lastCol'))
          styleNames.push('seCell')
      }
      const tcPr = child(cell, ns, 'tcPr')
      for (const name of styleNames) {
        const section = child(tableStyle, ns, name),
          tx = child(section, ns, 'tcTxStyle'),
          style = child(section, ns, 'tcStyle')
        const fill = color(child(style, ns, 'fill'))
        if (fill) result.fill = fill
        const textColor = color(tx)
        if (textColor) result.style.color = textColor
        for (const [attr, key] of [
          ['b', 'bold'],
          ['i', 'italic'],
        ] as const)
          if (tx?.hasAttribute(attr)) result.style[key] = on(tx, attr)
        const borders = child(style, ns, 'tcBdr')
        for (const side of ['top', 'right', 'bottom', 'left'] as const) {
          const ln = child(child(borders, ns, side), ns, 'ln')
          if (ln) {
            result.borders ??= {}
            result.borders[side] = {
              color: color(ln) ?? 'transparent',
              width: Number(ln.getAttribute('w') || 12700) / 9525,
            }
          }
        }
      }
      const direct = color(tcPr)
      if (direct) result.fill = direct
      if (child(tcPr, ns, 'noFill')) result.fill = 'transparent'
      result.verticalAlign =
        ({ ctr: 'center', b: 'bottom' } as const)[
          tcPr?.getAttribute('anchor') as 'ctr' | 'b'
        ] ?? 'top'
      for (const [side, attr] of [
        ['left', 'marL'],
        ['right', 'marR'],
        ['top', 'marT'],
        ['bottom', 'marB'],
      ] as const)
        if (tcPr?.hasAttribute(attr))
          result.margins[side] = Number(tcPr.getAttribute(attr)) / 9525
      for (const [side, attr] of [
        ['left', 'lnL'],
        ['right', 'lnR'],
        ['top', 'lnT'],
        ['bottom', 'lnB'],
      ] as const) {
        const ln = child(tcPr, ns, attr)
        if (ln) {
          result.borders ??= {}
          result.borders[side] = {
            color: color(ln) ?? 'transparent',
            width: Number(ln.getAttribute('w') || 12700) / 9525,
          }
        }
      }
      const body = child(cell, ns, 'txBody'),
        p = child(body, ns, 'p'),
        pp = child(p, ns, 'pPr'),
        rp = child(child(p, ns, 'r'), ns, 'rPr') ?? child(p, ns, 'endParaRPr')
      result.style = {
        ...result.style,
        ...textStyle(child(pp, ns, 'defRPr'), pp),
        ...textStyle(rp, pp),
      }
    })
  )
  return { cells, valid }
}
