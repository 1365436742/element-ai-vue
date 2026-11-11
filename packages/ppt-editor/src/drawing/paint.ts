export interface GradientPaint {
  kind: 'gradient'
  stops: { offset: number; color: string }[]
  angle?: number
  path?: string
  focus: { left: number; top: number; right: number; bottom: number }
  tile: { left: number; top: number; right: number; bottom: number }
}
export interface ImagePaint {
  kind: 'image'
  src: string
  tile?: boolean
}
export interface PatternPaint {
  kind: 'pattern'
  preset: string
  foreground: string
  background: string
}
export type DrawingPaint = GradientPaint | ImagePaint | PatternPaint
