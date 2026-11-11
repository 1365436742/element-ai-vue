const clamp = (n: number) => Math.max(0, Math.min(1, n))
function hsl(rgb: number[]): number[] {
  const [r, g, b] = rgb as [number, number, number]
  const max = Math.max(...rgb),
    min = Math.min(...rgb),
    delta = max - min,
    l = (max + min) / 2
  if (!delta) return [0, 0, l]
  const h =
    (max === r
      ? (g - b) / delta + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4) / 6
  return [h, delta / (1 - Math.abs(2 * l - 1)), l]
}
function rgb([h, s, l]: number[]): number[] {
  h = ((h! % 1) + 1) % 1
  s = clamp(s!)
  l = clamp(l!)
  const a = s * Math.min(l, 1 - l)
  return [0, 8, 4].map((n) => {
    const k = (n + h! * 12) % 12
    return l! - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  })
}
/** Ordered color transforms from DrawingML, without changing source XML. */
export function applyColorTransforms(color: string, node: any): string {
  if (!/^#[\da-f]{6}$/i.test(color)) return color
  const transforms = Array.from(node?.childNodes ?? []).filter(
    (n: any) => n.nodeType === 1
  ) as any[]
  if (!transforms.length) return color
  let channels = [1, 3, 5].map(
      (start) => parseInt(color.slice(start, start + 2), 16) / 255
    ),
    alpha = 1
  for (const t of transforms) {
    const name = t.localName,
      raw = Number(t.getAttribute('val')),
      value = raw / 100000
    if (!Number.isFinite(value)) continue
    if (name === 'tint') channels = channels.map((c) => 1 - (1 - c) * value)
    else if (name === 'shade') channels = channels.map((c) => c * value)
    else if (name === 'alpha') alpha = value
    else if (name === 'alphaMod') alpha *= value
    else if (name === 'alphaOff') alpha += value
    else if (/^(hue|sat|lum)(Mod|Off)?$/.test(name)) {
      const values = hsl(channels),
        index = name.startsWith('hue') ? 0 : name.startsWith('sat') ? 1 : 2
      const v =
        name.startsWith('hue') && !name.endsWith('Mod') ? raw / 21600000 : value
      values[index] = name.endsWith('Mod')
        ? values[index]! * v
        : name.endsWith('Off')
          ? values[index]! + v
          : v
      channels = rgb(values)
    } else if (/^(red|green|blue)(Mod|Off)?$/.test(name)) {
      const index = name.startsWith('red')
        ? 0
        : name.startsWith('green')
          ? 1
          : 2
      channels[index] = name.endsWith('Mod')
        ? channels[index]! * value
        : name.endsWith('Off')
          ? channels[index]! + value
          : value
    } else if (name === 'inv') channels = channels.map((c) => 1 - c)
    else if (name === 'comp') {
      const values = hsl(channels)
      values[0]! += 0.5
      channels = rgb(values)
    } else if (name === 'gray') {
      const grey =
        channels[0]! * 0.22 + channels[1]! * 0.72 + channels[2]! * 0.06
      channels = [grey, grey, grey]
    }
    channels = channels.map(clamp)
    alpha = clamp(alpha)
  }
  const bytes = channels.map((c) => Math.round(c * 255))
  return alpha < 1
    ? `rgba(${bytes.join(', ')}, ${Number(alpha.toFixed(5))})`
    : '#' +
        bytes
          .map((c) => c.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
}
