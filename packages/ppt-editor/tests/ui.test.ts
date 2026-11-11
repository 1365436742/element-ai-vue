import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import type { SceneObject } from '../src/types.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Element: dom.window.Element,
  SVGElement: dom.window.SVGElement,
  HTMLElement: dom.window.HTMLElement,
})
const { createApp, h, shallowRef, nextTick } = await import('vue')
const { TableInspector } = await import('../src/ui/TableInspector.js')

test('cell draft survives a remote snapshot and a rejected commit until the author restores it', async () => {
  const object = shallowRef<SceneObject>({
    id: '2',
    part: 'ppt/slides/slide1.xml',
    kind: 'table',
    name: 'Table',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    cells: [['original', 'other']],
  })
  const calls: unknown[] = []
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h(TableInspector, {
        object: object.value,
        editable: true,
        commit: async (...args: unknown[]) => {
          calls.push(args)
          throw new Error('Cell changed remotely')
        },
      }),
  })
  app.mount(host)
  try {
    const input = host.querySelector('textarea')!
    input.value = 'local draft\nline 2'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await nextTick()
    object.value = { ...object.value, cells: [['remote edit', 'other']] }
    await nextTick()
    assert.equal(input.value, 'local draft\nline 2')
    const button = (label: string) =>
      Array.from(host.querySelectorAll('button')).find(
        (node) => node.textContent === label
      )!
    button('应用单元格').click()
    await nextTick()
    await nextTick()
    assert.deepEqual(calls, [
      [0, 0, 'local draft\nline 2', 'original', undefined],
    ])
    assert.equal(input.value, 'local draft\nline 2')
    assert.match(
      host.querySelector('[role=alert]')!.textContent!,
      /changed remotely/
    )
    button('还原').click()
    await nextTick()
    assert.equal(input.value, 'remote edit')
  } finally {
    app.unmount()
    host.remove()
  }
})

for (const ordering of ['body', 'handle-first', 'handle-second'])
  test(`two-finger canvas gesture cancels object drag (${ordering})`, async () => {
    Object.assign(dom.window, { matchMedia: () => ({ matches: true }) })
    Object.assign(globalThis, {
      ResizeObserver: class {
        observe() {}
        disconnect() {}
      },
    })
    Object.assign(dom.window.HTMLElement.prototype, { setPointerCapture() {} })
    const { EditorController } = await import('../src/controller.js')
    const { PptEditor } = await import('../src/ui/PptEditor.js')
    const editor = new EditorController()
    const part = editor.getState().scene.slides[0]!.part
    await editor.execute({
      type: 'object.add',
      part,
      object: { kind: 'shape', frame: { x: 0, y: 0, width: 100, height: 100 } },
    })
    const before = editor.getState().revision
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp({
      render: () => h(PptEditor, { controller: editor }),
    })
    app.mount(host)
    const dispatch = (
      target: Element,
      type: string,
      id: number,
      x: number,
      y: number
    ) => {
      const event = new dom.window.Event(type, {
        bubbles: true,
        cancelable: true,
      })
      Object.assign(event, {
        pointerId: id,
        pointerType: 'touch',
        clientX: x,
        clientY: y,
        button: 0,
      })
      target.dispatchEvent(event)
    }
    try {
      await nextTick()
      const zoom = host.querySelector<HTMLInputElement>(
        '[aria-label="画布缩放"]'
      )!
      zoom.value = '100'
      zoom.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
      await nextTick()
      const canvas = host.querySelector('.ppt-canvas-area')!,
        shape = host.querySelector('.ppt-editing-slide .ppt-object')!
      dispatch(shape, 'pointerdown', 9, 100, 100)
      dispatch(shape, 'pointerup', 9, 100, 100)
      await nextTick()
      const handle = host.querySelector('.ppt-resize-handle')!
      const first = ordering === 'handle-first' ? handle : shape
      const second =
        ordering === 'handle-second'
          ? handle
          : ordering === 'handle-first'
            ? shape
            : canvas
      dispatch(first, 'pointerdown', 1, 100, 100)
      dispatch(first, 'pointermove', 1, 120, 100)
      dispatch(second, 'pointerdown', 2, 220, 100)
      dispatch(canvas, 'pointermove', 2, 320, 100)
      dispatch(canvas, 'pointerup', 2, 320, 100)
      dispatch(canvas, 'pointermove', 1, 150, 100)
      dispatch(first, 'pointerup', 1, 150, 100)
      await nextTick()
      assert.equal(zoom.value, '200')
      assert.equal(editor.getState().revision, before)
      assert.equal(editor.getState().scene.slides[0]!.objects[0]!.x, 0)
      dispatch(shape, 'pointerdown', 10, 100, 100)
      dispatch(shape, 'pointerup', 10, 100, 100)
      await nextTick()
      const select = host.querySelector('.ppt-inspector select')!
      const arrow = new dom.window.KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      })
      select.dispatchEvent(arrow)
      assert.equal(
        arrow.defaultPrevented,
        false,
        'selectors keep native arrow-key behavior'
      )
      assert.equal(editor.getState().revision, before)
      host.querySelector<HTMLButtonElement>('[aria-label="编辑文字"]')!.click()
      await nextTick()
      const done = host.querySelector<HTMLTextAreaElement>(
        '.ppt-editing-slide .ppt-text-editor'
      )!
      assert.ok(done, 'mobile text editor stays on the canvas')
      const space = new dom.window.KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        bubbles: true,
        cancelable: true,
      })
      done.dispatchEvent(space)
      assert.equal(
        space.defaultPrevented,
        false,
        'text editor retains native space input'
      )
    } finally {
      app.unmount()
      editor.destroy()
      host.remove()
    }
  })

test('table structure controls preserve drafts, enforce bounds and follow inserted/deleted cells', async () => {
  const object = shallowRef<SceneObject>({
    id: '2',
    part: 'ppt/slides/slide1.xml',
    kind: 'table',
    name: 'Table',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    cells: [
      ['A', 'B'],
      ['C', 'D'],
    ],
  })
  const editable = shallowRef(true)
  const calls: unknown[] = []
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h(TableInspector, {
        object: object.value,
        editable: editable.value,
        commit: async () => {},
        structure: async (axis: string, action: string, index: number) => {
          calls.push([axis, action, index])
          const cells = object.value.cells!.map((row) => [...row])
          if (axis === 'row') {
            if (action === 'insert')
              cells.splice(
                index,
                0,
                cells[0]!.map(() => '')
              )
            else cells.splice(index, 1)
          } else
            for (const row of cells) {
              if (action === 'insert') row.splice(index, 0, '')
              else row.splice(index, 1)
            }
          object.value = { ...object.value, cells }
        },
      }),
  })
  app.mount(host)
  const button = (label: string) =>
    Array.from(host.querySelectorAll('button')).find(
      (node) => node.textContent === label
    )!
  const settle = async () => {
    await nextTick()
    await nextTick()
  }
  try {
    assert.ok(button('下方插行'), 'row controls are present')
    const input = host.querySelector('textarea')!
    input.value = 'draft'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await settle()
    assert.equal(button('下方插行').disabled, true)
    button('还原').click()
    await settle()
    button('下方插行').click()
    await settle()
    assert.deepEqual(calls, [['row', 'insert', 1]])
    assert.equal(host.querySelector('select')!.value, '1')
    button('删除行').click()
    await settle()
    assert.equal(input.value, 'C')
    button('右侧插列').click()
    await settle()
    assert.deepEqual(calls.at(-1), ['column', 'insert', 1])
    assert.equal(host.querySelectorAll('select')[1]!.value, '1')
    editable.value = false
    await settle()
    assert.equal(button('删除列').disabled, true)
    editable.value = true
    object.value = { ...object.value, cells: [['only']] }
    await settle()
    assert.equal(button('删除行').disabled, true)
    assert.equal(button('删除列').disabled, true)
    assert.equal(host.querySelector('select')!.value, '0')
    assert.equal(host.querySelectorAll('select')[1]!.value, '0')
  } finally {
    app.unmount()
    host.remove()
  }
})

test('remote table structure changes keep a cell draft and prevent saving into a shifted cell', async () => {
  const object = shallowRef<SceneObject>({
    id: '2',
    part: 'ppt/slides/slide1.xml',
    kind: 'table',
    name: 'Table',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    cells: [['A'], ['B']],
  })
  let saved = false
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h(TableInspector, {
        object: object.value,
        editable: true,
        commit: async () => {
          saved = true
        },
      }),
  })
  app.mount(host)
  const button = (label: string) =>
    Array.from(host.querySelectorAll('button')).find(
      (node) => node.textContent === label
    )!
  try {
    const input = host.querySelector('textarea')!
    input.value = 'draft'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await nextTick()
    object.value = { ...object.value, cells: [['new'], ['A'], ['B']] }
    await nextTick()
    assert.equal(input.value, 'draft')
    assert.equal(button('应用单元格').disabled, true)
    button('应用单元格').click()
    await nextTick()
    assert.equal(saved, false)
    assert.match(host.querySelector('[role=alert]')!.textContent!, /结构/)
    button('还原').click()
    await nextTick()
    assert.equal(input.value, 'new')
  } finally {
    app.unmount()
    host.remove()
  }
})

test('a coalesced remote structure revision blocks an old draft even when cell content and counts match', async () => {
  const revision = shallowRef(1)
  const object: SceneObject = {
    id: '2',
    part: 'ppt/slides/slide1.xml',
    kind: 'table',
    name: 'Table',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    cells: [['', '']],
  }
  let saved = false
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h(TableInspector, {
        object,
        revision: revision.value,
        editable: true,
        commit: async () => {
          saved = true
        },
      }),
  })
  app.mount(host)
  const button = (label: string) =>
    Array.from(host.querySelectorAll('button')).find(
      (node) => node.textContent === label
    )!
  try {
    const input = host.querySelector('textarea')!
    input.value = 'draft'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await nextTick()
    // A remote insert+delete can leave the same text and dimensions but move cell identities.
    revision.value = 3
    await nextTick()
    assert.equal(input.value, 'draft')
    assert.equal(button('应用单元格').disabled, true)
    button('应用单元格').click()
    await nextTick()
    assert.equal(saved, false)
    assert.match(host.querySelector('[role=alert]')!.textContent!, /版本/)
    button('还原').click()
    await nextTick()
    input.value = 'fresh'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await nextTick()
    button('应用单元格').click()
    await nextTick()
    assert.equal(saved, true)
  } finally {
    app.unmount()
    host.remove()
  }
})

test('table preview fills subpixel frames with proportional explicit tracks', async () => {
  const { objectContent } = await import('../src/ui/scene.js')
  const object: SceneObject = {
    id: '2',
    part: 'ppt/slides/slide1.xml',
    kind: 'table',
    name: 'Tiny',
    x: 0,
    y: 0,
    width: 0.5,
    height: 0.5,
    cells: [
      ['A', 'B'],
      ['C', 'D'],
    ],
    columnWidths: [0.1, 0.4],
    rowHeights: [0.05, 0.45],
  }
  const host = document.createElement('div')
  const app = createApp({ render: () => objectContent(object) })
  app.mount(host)
  try {
    const table = host.querySelector<HTMLElement>('[role=table]')!
    for (const [tracks, ratio] of [
      [table.style.gridTemplateColumns, 0.25],
      [table.style.gridTemplateRows, 1 / 9],
    ] as const) {
      const weights = [...tracks.matchAll(/([\d.e+-]+)fr/g)].map((match) =>
        Number(match[1])
      )
      assert.equal(weights.length, 2)
      assert.ok(
        weights.reduce((sum, weight) => sum + weight, 0) >= 1,
        'fractional tracks must fill the available axis'
      )
      assert.ok(Math.abs(weights[0]! / weights[1]! - ratio) < 1e-10)
    }
  } finally {
    app.unmount()
  }
})

test('merged table preview spans its anchor and inspector redirects covered coordinates', async () => {
  const { objectContent } = await import('../src/ui/scene.js')
  const base = {
    rowSpan: 1,
    columnSpan: 1,
    style: {},
    verticalAlign: 'top' as const,
    margins: { left: 0, right: 0, top: 0, bottom: 0 },
  }
  const object: SceneObject = {
    id: '2',
    part: 'ppt/slides/slide1.xml',
    kind: 'table',
    name: 'Merged',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    cells: [
      ['Anchor', ''],
      ['', ''],
    ],
    tableCells: [
      [
        { ...base, rowSpan: 2, columnSpan: 2 },
        { ...base, mergedInto: { row: 0, column: 0 } },
      ],
      [
        { ...base, mergedInto: { row: 0, column: 0 } },
        { ...base, mergedInto: { row: 0, column: 0 } },
      ],
    ],
    columnWidths: [100, 100],
    rowHeights: [50, 50],
  }
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h('div', [
        objectContent(object),
        h(TableInspector, {
          object,
          editable: true,
          commit: async () => {},
          structure: async () => {},
        }),
      ]),
  })
  app.mount(host)
  try {
    assert.equal(host.querySelectorAll('[role=cell]').length, 1)
    const cell = host.querySelector<HTMLElement>('[role=cell]')!
    assert.equal(cell.getAttribute('aria-colspan'), '2')
    assert.equal(cell.style.gridColumn, '1 / span 2')
    const column = host.querySelectorAll('select')[1]!
    column.value = '1'
    column.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
    await nextTick()
    assert.equal(column.value, '0')
    assert.equal(host.querySelector('textarea')!.value, 'Anchor')
    assert.equal(
      Array.from(host.querySelectorAll('button')).find(
        (b) => b.textContent === '删除列'
      )!.disabled,
      true
    )
  } finally {
    app.unmount()
    host.remove()
  }
})

test('shape preview renders editable geometry paths and connector arrows instead of a rectangle', async () => {
  const { objectContent } = await import('../src/ui/scene.js')
  const object: SceneObject = {
    id: '1',
    part: 'ppt/slides/slide1.xml',
    kind: 'shape',
    name: 'Arrow',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    fill: '#4472C4',
    stroke: '#112233',
    strokeWidth: 2,
    strokeDash: 'dash',
    tailEnd: 'triangle',
    paths: [{ d: 'M0 50 L200 50', fill: 'none', stroke: true }],
  }
  const host = document.createElement('div')
  const app = createApp({ render: () => objectContent(object) })
  app.mount(host)
  try {
    const path = host.querySelector('svg > path')!
    assert.ok(path)
    assert.equal(path.getAttribute('d'), 'M0 50 L200 50')
    assert.equal(path.getAttribute('fill'), 'none')
    assert.match(path.getAttribute('marker-end')!, /^url\(#/)
    assert.ok(path.getAttribute('stroke-dasharray'))
  } finally {
    app.unmount()
  }
})

test('SmartArt inspector commits selected data node and preserves drafts after remote revisions', async () => {
  const { DiagramInspector } = await import('../src/ui/DiagramInspector.js')
  const object = shallowRef<SceneObject>({
    id: '6',
    part: 'slide.xml',
    kind: 'diagram',
    name: 'Diagram',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    diagramTexts: [
      { id: 'data-a', text: 'Original' },
      { id: 'data-b', text: 'Second' },
    ],
  })
  const revision = shallowRef(1),
    calls: unknown[] = []
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h(DiagramInspector, {
        object: object.value,
        revision: revision.value,
        editable: true,
        commit: async (...args: unknown[]) => {
          calls.push(args)
          object.value = {
            ...object.value,
            diagramTexts: [{ id: 'data-a', text: args[1] as string }],
          }
          revision.value++
        },
      }),
  })
  app.mount(host)
  try {
    const input = host.querySelector('textarea')!
    const button = (text: string) =>
      Array.from(host.querySelectorAll('button')).find(
        (b) => b.textContent === text
      )!
    input.value = 'Edited'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await nextTick()
    const selector = host.querySelector('select')!
    assert.equal(selector.disabled, true)
    selector.value = 'data-b'
    selector.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
    await nextTick()
    assert.equal(input.value, 'Edited')
    button('应用节点文字').click()
    await nextTick()
    await nextTick()
    assert.equal(selector.disabled, false)
    assert.deepEqual(calls, [['data-a', 'Edited', 1]])
    input.value = 'Unsaved'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await nextTick()
    object.value = {
      ...object.value,
      diagramTexts: [{ id: 'data-a', text: 'Remote' }],
    }
    revision.value++
    await nextTick()
    assert.equal(input.value, 'Unsaved')
    button('应用节点文字').click()
    await nextTick()
    await nextTick()
    assert.equal(calls.length, 1)
    assert.match(host.querySelector('[role=alert]')!.textContent!, /草稿已保留/)
    button('还原节点文字').click()
    await nextTick()
    assert.equal(input.value, 'Remote')
  } finally {
    app.unmount()
    host.remove()
  }
})

test('SmartArt local coordinate layer scales geometry and text together', async () => {
  const { objectContent } = await import('../src/ui/scene.js')
  const object = {
    id: 'd',
    part: 'slide.xml',
    kind: 'diagram',
    name: 'Diagram',
    x: 0,
    y: 0,
    width: 200,
    height: 300,
    childCoordinateSize: { width: 100, height: 100 },
    children: [
      {
        id: 'c',
        part: 'drawing.xml',
        kind: 'text',
        name: 'Node',
        x: 10,
        y: 20,
        width: 50,
        height: 40,
        text: 'Node',
        style: { fontSize: 12 },
        textRect: { x: 2, y: 3, width: 40, height: 30 },
      },
    ],
  } as SceneObject
  const host = document.createElement('div')
  const app = createApp({ render: () => objectContent(object) })
  app.mount(host)
  try {
    const layer = host.querySelector<HTMLElement>('.ppt-diagram-coordinates')!
    assert.ok(layer)
    assert.equal(layer.style.width, '100px')
    assert.equal(layer.style.height, '100px')
    assert.equal(layer.style.transform, 'scale(2, 3)')
    assert.equal(layer.style.transformOrigin, '0 0')
    assert.equal((layer.firstElementChild as HTMLElement).style.left, '10px')
    assert.equal(
      layer.querySelector<HTMLElement>('.ppt-object-content')!.style.fontSize,
      '12px'
    )
  } finally {
    app.unmount()
  }
})

test(
  'media objects have a separate selection control without hijacking native playback',
  { skip: !process.env.PPT_SAMPLE_PATH },
  async () => {
    Object.assign(dom.window, { matchMedia: () => ({ matches: false }) })
    Object.assign(globalThis, {
      ResizeObserver: class {
        observe() {}
        disconnect() {}
      },
    })
    const { readFileSync } = await import('node:fs')
    const { EditorController } = await import('../src/controller.js')
    const { PptEditor } = await import('../src/ui/PptEditor.js')
    const editor = new EditorController()
    await editor.open({
      type: 'file',
      file: new Uint8Array(readFileSync(process.env.PPT_SAMPLE_PATH!)).buffer,
    })
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp({
      render: () => h(PptEditor, { controller: editor }),
    })
    app.mount(host)
    try {
      ;(
        host.querySelector('[aria-label="幻灯片 12"]') as HTMLButtonElement
      ).click()
      await nextTick()
      const select = host.querySelector(
        '[aria-label="选择媒体 flower.mp4"]'
      ) as HTMLButtonElement
      assert.ok(select)
      select.click()
      await nextTick()
      assert.match(
        host.querySelector('.ppt-inspector')!.textContent!,
        /媒体资源/
      )
      assert.ok(host.querySelector('video[controls]'))
    } finally {
      app.unmount()
      editor.destroy()
      host.remove()
    }
  }
)

test('image crop inspector exposes percentages and writes fractional OOXML values', async () => {
  const { AssetInspector } = await import('../src/ui/AssetInspector.js')
  const object: SceneObject = {
    id: '1',
    part: 'slide.xml',
    kind: 'image',
    name: 'Image',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    crop: { left: 0, right: 0, top: 0, bottom: 0.37302 },
  }
  const calls: unknown[] = []
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h(AssetInspector, {
        object,
        editable: true,
        execute: async (c) => {
          calls.push(c)
        },
      }),
  })
  app.mount(host)
  try {
    const field = host.querySelector(
      '[aria-label="下侧裁剪百分比"]'
    ) as HTMLInputElement
    assert.equal(field.value, '37.302')
    field.value = '25'
    field.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
    await nextTick()
    assert.equal((calls[0] as any).crop.bottom, 0.25)
  } finally {
    app.unmount()
    host.remove()
  }
})
