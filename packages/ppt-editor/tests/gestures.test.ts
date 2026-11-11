import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CanvasGestures } from '../src/ui/gestures.js'

test('pinch keeps its document anchor under the moving midpoint and supports two-finger pan', () => {
  const gesture = new CanvasGestures()
  const view = { scale: 1, x: 10, y: 20, center: { x: 200, y: 200 } }
  assert.equal(gesture.begin(1, { x: 210, y: 220 }, false, view), false)
  assert.equal(gesture.begin(2, { x: 310, y: 220 }, false, view), true)
  const changed = gesture.move(2, { x: 410, y: 220 })!
  assert.deepEqual(changed, { scale: 2, x: 10, y: 20 })
  gesture.move(1, { x: 230, y: 240 })
  const panned = gesture.move(2, { x: 430, y: 240 })!
  assert.deepEqual(panned, { scale: 2, x: 30, y: 40 })
  gesture.end(2)
  assert.equal(gesture.move(1, { x: 999, y: 999 }), undefined)
  assert.equal(gesture.active, true)
  gesture.end(1)
  assert.equal(gesture.active, false)
})
test('background pan changes only view offset and cancellation resets all gesture state', () => {
  const gesture = new CanvasGestures()
  assert.equal(
    gesture.begin(1, { x: 10, y: 10 }, true, {
      scale: 0.5,
      x: 0,
      y: 0,
      center: { x: 200, y: 200 },
    }),
    true
  )
  assert.deepEqual(gesture.move(1, { x: 40, y: 60 }), {
    scale: 0.5,
    x: 30,
    y: 50,
  })
  gesture.reset()
  assert.equal(gesture.move(1, { x: 80, y: 90 }), undefined)
  assert.equal(gesture.active, false)
})
