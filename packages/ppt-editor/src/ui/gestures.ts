interface Point {
  x: number
  y: number
}
export interface CanvasView extends Point {
  scale: number
}
interface GestureView extends CanvasView {
  center: Point
}

/** View-only gestures never emit document mutations. */
export class CanvasGestures {
  private points = new Map<number, Point>()
  private gesture?:
    | { kind: 'pan'; id: number; start: Point; view: GestureView }
    | {
        kind: 'pinch'
        ids: [number, number]
        distance: number
        anchor: Point
        view: GestureView
      }
  private blocked = false
  get active() {
    return !!this.gesture || this.blocked
  }
  get pointerIds() {
    return [...this.points.keys()]
  }
  begin(id: number, point: Point, allowPan: boolean, view: GestureView) {
    this.points.set(id, point)
    if (this.points.size === 2 && !this.blocked) {
      const ids = [...this.points.keys()] as [number, number]
      const a = this.points.get(ids[0])!,
        b = this.points.get(ids[1])!
      this.gesture = {
        kind: 'pinch',
        ids,
        distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
        anchor: {
          x: ((a.x + b.x) / 2 - view.center.x - view.x) / view.scale,
          y: ((a.y + b.y) / 2 - view.center.y - view.y) / view.scale,
        },
        view,
      }
    } else if (this.points.size === 1 && allowPan && !this.blocked) {
      this.gesture = { kind: 'pan', id, start: point, view }
    }
    return this.active
  }
  move(id: number, point: Point): CanvasView | undefined {
    if (!this.points.has(id)) return
    this.points.set(id, point)
    const gesture = this.gesture
    if (!gesture || this.blocked) return
    if (gesture.kind === 'pan') {
      if (id !== gesture.id) return
      return {
        scale: gesture.view.scale,
        x: gesture.view.x + point.x - gesture.start.x,
        y: gesture.view.y + point.y - gesture.start.y,
      }
    }
    const a = this.points.get(gesture.ids[0]),
      b = this.points.get(gesture.ids[1])
    if (!a || !b) return
    const scale = Math.max(
      0.1,
      Math.min(
        3,
        (gesture.view.scale * Math.hypot(b.x - a.x, b.y - a.y)) /
          gesture.distance
      )
    )
    return {
      scale,
      x: (a.x + b.x) / 2 - gesture.view.center.x - gesture.anchor.x * scale,
      y: (a.y + b.y) / 2 - gesture.view.center.y - gesture.anchor.y * scale,
    }
  }
  end(id: number) {
    if (!this.points.delete(id)) return
    if (this.gesture?.kind === 'pinch' && this.gesture.ids.includes(id)) {
      this.gesture = undefined
      this.blocked = this.points.size > 0
    } else if (this.gesture?.kind === 'pan' && this.gesture.id === id)
      this.gesture = undefined
    if (!this.points.size) this.reset()
  }
  reset() {
    this.points.clear()
    this.gesture = undefined
    this.blocked = false
  }
}
