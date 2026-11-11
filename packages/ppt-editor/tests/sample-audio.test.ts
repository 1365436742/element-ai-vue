import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import type { SceneObject } from '../src/types.js'
const dom = new JSDOM('<html><body></body></html>')
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Element: dom.window.Element,
  SVGElement: dom.window.SVGElement,
  HTMLElement: dom.window.HTMLElement,
})
const { createApp, h, nextTick } = await import('vue')
const { objectContent } = await import('../src/ui/scene.js')
const object: SceneObject = {
  id: '7',
  part: 'ppt/slides/slide12.xml',
  kind: 'media',
  mediaType: 'audio',
  name: 'Sample audio',
  src: 'data:audio/mpeg;base64,SUQz',
  poster: 'data:image/png;base64,AQ==',
  x: 10,
  y: 20,
  width: 85,
  height: 85,
}

test('small audio object retains poster and exposes playback, pause, ended and error state without dragging', async () => {
  let plays = 0,
    pauses = 0,
    drags = 0,
    fail = false
  dom.window.HTMLMediaElement.prototype.play = async function () {
    plays++
    if (fail) throw Error('Codec unavailable')
    this.dispatchEvent(new dom.window.Event('play'))
  }
  dom.window.HTMLMediaElement.prototype.pause = function () {
    pauses++
    this.dispatchEvent(new dom.window.Event('pause'))
  }
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h('div', { onPointerdown: () => drags++ }, [objectContent(object)]),
  })
  app.mount(host)
  try {
    const button = () => host.querySelector('button')!
    assert.ok(button(), 'play button remains available at 85px frame')
    assert.match(button().getAttribute('aria-label')!, /播放/)
    assert.equal(host.querySelector('img')?.src, object.poster)
    const audio = host.querySelector('audio')!
    assert.equal(audio.preload, 'none')
    assert.equal(audio.autoplay, false)
    assert.equal(host.querySelectorAll('audio').length, 1)
    button().dispatchEvent(
      new dom.window.Event('pointerdown', { bubbles: true })
    )
    assert.equal(drags, 0)
    button().click()
    await nextTick()
    await nextTick()
    assert.equal(plays, 1)
    assert.match(button().getAttribute('aria-label')!, /暂停/)
    button().click()
    await nextTick()
    assert.ok(pauses >= 1)
    assert.match(button().getAttribute('aria-label')!, /播放/)
    button().click()
    await nextTick()
    audio.dispatchEvent(new dom.window.Event('ended'))
    await nextTick()
    assert.match(button().getAttribute('aria-label')!, /播放/)
    button().click()
    await nextTick()
    audio.dispatchEvent(new dom.window.Event('error'))
    await nextTick()
    assert.match(button().getAttribute('aria-label')!, /播放/)
    assert.ok(host.querySelector('[role=alert]'))
    fail = true
    button().click()
    await nextTick()
    await nextTick()
    assert.match(button().getAttribute('aria-label')!, /播放/)
    assert.ok(host.querySelector('[role=alert]'))
  } finally {
    app.unmount()
    host.remove()
  }
  assert.ok(pauses >= 2, 'unmount pauses the single player')
})
test('audio thumbnail stays a poster and video remains native controls', () => {
  assert.equal(objectContent(object, true).type, 'div')
  const video = objectContent({ ...object, mediaType: 'video' })
  assert.equal(video.type, 'video')
  assert.equal(video.props?.controls, true)
})
