import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><html><body></body></html>')
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Element: dom.window.Element,
  SVGElement: dom.window.SVGElement,
  HTMLElement: dom.window.HTMLElement,
  ResizeObserver: class {
    observe() {}
    disconnect() {}
  },
})
Object.assign(dom.window, { matchMedia: () => ({ matches: false }) })
Object.assign(dom.window.HTMLElement.prototype, { setPointerCapture() {} })
const { createApp, h, nextTick } = await import('vue')
const { EditorController } = await import('../src/controller.js')
const { PptEditor } = await import('../src/ui/PptEditor.js')
const flush = async () => {
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
  await nextTick()
}
function mount(editor: InstanceType<typeof EditorController>) {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({ render: () => h(PptEditor, { controller: editor }) })
  app.mount(host)
  return {
    host,
    close() {
      app.unmount()
      editor.destroy()
      host.remove()
    },
  }
}
function pointer(el: Element, type: string, x: number, y: number) {
  const e = new dom.window.Event(type, { bubbles: true, cancelable: true })
  Object.assign(e, {
    button: 0,
    pointerId: 1,
    pointerType: 'mouse',
    clientX: x,
    clientY: y,
  })
  el.dispatchEvent(e)
}
test('presentation disables object movement/editing and supports controls plus keyboard navigation', async () => {
  const editor = new EditorController(),
    part = editor.getState().scene.slides[0]!.part
  await editor.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'text',
      text: 'Hello',
      frame: { x: 10, y: 10, width: 200, height: 80 },
    },
  })
  await editor.execute({ type: 'slide.add' })
  const { host, close } = mount(editor)
  try {
    ;(host.querySelector('.ppt-preview-button') as HTMLButtonElement).click()
    await flush()
    const revision = editor.getState().revision
    const object = host.querySelector('.ppt-editing-slide .ppt-object')!
    pointer(object, 'pointerdown', 20, 20)
    pointer(object, 'pointermove', 120, 120)
    pointer(object, 'pointerup', 120, 120)
    object.dispatchEvent(
      new dom.window.MouseEvent('dblclick', { bubbles: true })
    )
    await flush()
    assert.equal(editor.getState().revision, revision)
    assert.equal(host.querySelector('.ppt-editing-slide textarea'), null)
    assert.ok(
      (host.querySelector('[aria-label="上一页"]') as HTMLButtonElement)
        .disabled
    )
    ;(host.querySelector('[aria-label="下一页"]') as HTMLButtonElement).click()
    await flush()
    assert.match(
      host.querySelector('.ppt-presentation-controls')!.textContent!,
      /2\s*\/\s*2/
    )
    assert.ok(
      (host.querySelector('[aria-label="下一页"]') as HTMLButtonElement)
        .disabled
    )
    host.querySelector('.ppt-editor')!.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
      })
    )
    await flush()
    assert.match(
      host.querySelector('.ppt-presentation-controls')!.textContent!,
      /1\s*\/\s*2/
    )
    host.querySelector('.ppt-editor')!.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      })
    )
    await flush()
    assert.equal(host.querySelector('.is-presenting'), null)
  } finally {
    close()
  }
})
test('double-click edits a table cell in place, saves multiline content and Escape cancels', async () => {
  const editor = new EditorController(),
    part = editor.getState().scene.slides[0]!.part
  await editor.execute({
    type: 'table.add',
    part,
    frame: { x: 20, y: 20, width: 300, height: 120 },
    cells: [
      ['A', 'B'],
      ['C', 'D'],
    ],
  })
  const { host, close } = mount(editor)
  try {
    const cell = () =>
      host.querySelectorAll('.ppt-editing-slide [role=cell]')[3]!
    let captures = 0
    const wrapper = cell().closest('.ppt-object') as HTMLElement
    wrapper.setPointerCapture = () => {
      captures++
    }
    pointer(cell(), 'pointerdown', 20, 20)
    pointer(cell(), 'pointerup', 20, 20)
    assert.equal(
      captures,
      0,
      'clicks preserve the cell as the native dblclick target'
    )
    cell().dispatchEvent(
      new dom.window.MouseEvent('dblclick', { bubbles: true })
    )
    await flush()
    const input = cell().querySelector('textarea')!
    assert.ok(input)
    assert.equal(input.value, 'D')
    input.value = 'Changed\nsecond line'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    input.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
      })
    )
    await flush()
    assert.equal(
      editor.getState().scene.slides[0]!.objects[0]!.cells![1]![1],
      'Changed\nsecond line'
    )
    cell().dispatchEvent(
      new dom.window.MouseEvent('dblclick', { bubbles: true })
    )
    await flush()
    const cancel = cell().querySelector('textarea')!
    cancel.value = 'discard'
    cancel.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    cancel.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    )
    await flush()
    assert.equal(
      editor.getState().scene.slides[0]!.objects[0]!.cells![1]![1],
      'Changed\nsecond line'
    )
    editor.setEditable(false)
    cell().dispatchEvent(
      new dom.window.MouseEvent('dblclick', { bubbles: true })
    )
    await flush()
    assert.equal(cell().querySelector('textarea'), null)
  } finally {
    close()
  }
})

test('concurrent changes retain the inline draft without writing into changed cells', async () => {
  const editor = new EditorController(),
    part = editor.getState().scene.slides[0]!.part
  const result = await editor.execute({
    type: 'table.add',
    part,
    frame: { x: 20, y: 20, width: 300, height: 120 },
    cells: [['A', 'B']],
  })
  const { host, close } = mount(editor)
  try {
    host
      .querySelector('.ppt-editing-slide [role=cell]')!
      .dispatchEvent(new dom.window.MouseEvent('dblclick', { bubbles: true }))
    await flush()
    const input = host.querySelector(
      '.ppt-inline-cell-editor'
    ) as HTMLTextAreaElement
    input.value = 'local draft'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await editor.execute({
      type: 'table.set',
      ref: result.ref!,
      cells: [['remote', 'B']],
    })
    await flush()
    input.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
      })
    )
    await flush()
    assert.equal(
      editor.getState().scene.slides[0]!.objects[0]!.cells![0]![0],
      'remote'
    )
    assert.equal(
      (host.querySelector('.ppt-inline-cell-editor') as HTMLTextAreaElement)
        .value,
      'local draft'
    )
    assert.match(
      host.querySelector('.ppt-inline-error')!.textContent!,
      /草稿已保留/
    )
    editor.setEditable(false)
    await flush()
    assert.ok(input.readOnly)
  } finally {
    close()
  }
})

test('mobile text edits stay on canvas and unchanged thumbnails are not regenerated', async () => {
  Object.assign(dom.window, { matchMedia: () => ({ matches: true }) })
  const editor = new EditorController(),
    part = editor.getState().scene.slides[0]!.part
  await editor.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'shape',
      geometry: 'rect',
      text: 'Hello',
      frame: { x: 10, y: 10, width: 200, height: 80 },
    },
  })
  await editor.execute({ type: 'slide.add' })
  const other = editor.getState().scene.slides[1]!.part
  await editor.execute({
    type: 'object.add',
    part: other,
    object: {
      kind: 'shape',
      geometry: 'ellipse',
      text: 'Other',
      frame: { x: 10, y: 10, width: 200, height: 80 },
    },
  })
  const { host, close } = mount(editor)
  try {
    const svg = host.querySelectorAll('.ppt-miniature svg')[1]!,
      before = svg.outerHTML
    host
      .querySelector('.ppt-editing-slide .ppt-object')!
      .dispatchEvent(new dom.window.MouseEvent('dblclick', { bubbles: true }))
    await flush()
    const input = host.querySelector(
      '.ppt-editing-slide .ppt-text-editor'
    ) as HTMLTextAreaElement
    assert.ok(input)
    assert.equal(host.querySelector('.ppt-mobile-text-sheet'), null)
    input.value = 'direct mobile'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await flush()
    assert.equal(svg.outerHTML, before)
    input.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        bubbles: true,
      })
    )
    await flush()
    assert.equal(
      editor.getState().scene.slides[0]!.objects[0]!.text,
      'direct mobile'
    )
    assert.equal(host.querySelectorAll('.ppt-miniature svg')[1], svg)
    assert.equal(svg.outerHTML, before)
  } finally {
    close()
    Object.assign(dom.window, { matchMedia: () => ({ matches: false }) })
  }
})

test(
  'sample merged cell and SmartArt node edit in place',
  { skip: !process.env.PPT_SAMPLE_PATH },
  async () => {
    const { readFileSync } = await import('node:fs')
    const editor = new EditorController()
    await editor.open({
      type: 'file',
      file: new Uint8Array(readFileSync(process.env.PPT_SAMPLE_PATH!)).buffer,
    })
    const { host, close } = mount(editor)
    try {
      ;(
        host.querySelector('[aria-label="幻灯片 13"]') as HTMLButtonElement
      ).click()
      await flush()
      const cell = host.querySelector(
        '.ppt-editing-slide [data-ppt-row="1"][data-ppt-column="5"]'
      )!
      assert.equal(cell.getAttribute('aria-colspan'), '3')
      cell.dispatchEvent(
        new dom.window.MouseEvent('dblclick', { bubbles: true })
      )
      await flush()
      const input = cell.querySelector('textarea')!
      assert.ok(input)
      input.value = '合并格原位编辑'
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
      input.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', {
          key: 'Enter',
          ctrlKey: true,
          bubbles: true,
        })
      )
      await flush()
      const table = editor
        .getState()
        .scene.slides[12]!.objects.find((o) => o.kind === 'table')!
      assert.equal(table.cells![1]![5], '合并格原位编辑')
      assert.equal(table.tableCells![1]![5]!.columnSpan, 3)
      ;(
        host.querySelector('[aria-label="幻灯片 11"]') as HTMLButtonElement
      ).click()
      await flush()
      const node = Array.from(
        host.querySelectorAll('.ppt-editing-slide [data-ppt-diagram-node]')
      ).find((el) => el.textContent?.trim())!
      assert.ok(node)
      const id = node.getAttribute('data-ppt-diagram-node')!
      node.dispatchEvent(
        new dom.window.MouseEvent('dblclick', { bubbles: true })
      )
      await flush()
      const edit = node.querySelector('textarea')!
      assert.ok(edit)
      edit.value = '节点原位编辑'
      edit.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
      edit.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', {
          key: 'Enter',
          ctrlKey: true,
          bubbles: true,
        })
      )
      await flush()
      assert.ok(
        editor
          .getState()
          .scene.slides[10]!.objects.some((o) =>
            o.diagramTexts?.some(
              (t) => t.id === id && t.text === '节点原位编辑'
            )
          )
      )
      assert.match(
        host.querySelector('.ppt-editing-slide')!.textContent!,
        /节点原位编辑/
      )
    } finally {
      close()
    }
  }
)

test('preview buttons keep native Space activation and readonly sessions can exit', async () => {
  const editor = new EditorController()
  await editor.execute({ type: 'slide.add' })
  const { host, close } = mount(editor)
  try {
    ;(
      host.querySelector('[aria-label="幻灯片 2"]') as HTMLButtonElement
    ).click()
    await flush()
    ;(host.querySelector('.ppt-preview-button') as HTMLButtonElement).click()
    await flush()
    for (const label of ['上一页', '退出预览']) {
      const button = host.querySelector(
        `[aria-label="${label}"]`
      ) as HTMLButtonElement
      const event = new dom.window.KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        bubbles: true,
        cancelable: true,
      })
      button.dispatchEvent(event)
      await flush()
      assert.equal(event.defaultPrevented, false)
      assert.match(
        host.querySelector('.ppt-presentation-controls')!.textContent!,
        /2\s*\/\s*2/
      )
    }
    editor.setEditable(false)
    await flush()
    host.querySelector('.ppt-editor')!.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      })
    )
    await flush()
    assert.equal(host.querySelector('.is-presenting'), null)
  } finally {
    close()
  }
})

test('generation lock stops ordinary canvas text editing and preserves its draft', async () => {
  const editor = new EditorController(),
    part = editor.getState().scene.slides[0]!.part
  await editor.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'text',
      text: 'Original',
      frame: { x: 0, y: 0, width: 200, height: 80 },
    },
  })
  const { host, close } = mount(editor)
  try {
    host
      .querySelector('.ppt-editing-slide .ppt-object')!
      .dispatchEvent(new dom.window.MouseEvent('dblclick', { bubbles: true }))
    await flush()
    const input = host.querySelector('.ppt-text-editor') as HTMLTextAreaElement
    input.value = 'keep this draft'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await editor.applyGenerationEvent({
      type: 'generation.start',
      sessionId: 'lock-test',
      seq: 0,
      mode: 'append',
    })
    await flush()
    assert.equal(
      host.querySelector('.ppt-editing-slide textarea:not([readonly])'),
      null
    )
    assert.equal(
      (host.querySelector('[aria-label="未提交文字草稿"]') as HTMLInputElement)
        .value,
      'keep this draft'
    )
    assert.equal(
      editor.getState().scene.slides[0]!.objects[0]!.text,
      'Original'
    )
  } finally {
    close()
  }
})

test('release outside an object before capture cancels drag without stale hover movement', async () => {
  const editor = new EditorController(),
    part = editor.getState().scene.slides[0]!.part
  await editor.execute({
    type: 'object.add',
    part,
    object: { kind: 'shape', frame: { x: 10, y: 10, width: 20, height: 20 } },
  })
  const { host, close } = mount(editor)
  try {
    const object = host.querySelector(
      '.ppt-editing-slide .ppt-object'
    ) as HTMLElement
    let captures = 0
    object.setPointerCapture = () => {
      captures++
    }
    pointer(object, 'pointerdown', 20, 20)
    const up = new dom.window.Event('pointerup', { bubbles: true })
    Object.assign(up, { pointerId: 1 })
    window.dispatchEvent(up)
    pointer(object, 'pointermove', 80, 80)
    await flush()
    assert.equal(captures, 0)
    assert.equal(editor.getState().scene.slides[0]!.objects[0]!.x, 10)
    assert.equal(object.style.left, '10px')
  } finally {
    close()
  }
})

test('editing a filled shape preserves its geometry and existing text alignment', async () => {
  const editor = new EditorController(),
    part = editor.getState().scene.slides[0]!.part
  await editor.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'shape',
      geometry: 'roundRect',
      fill: '#173f3b',
      stroke: '#ce622e',
      text: 'Centered label',
      style: { align: 'center', color: '#ffffff' },
      frame: { x: 20, y: 20, width: 300, height: 160 },
    },
  })
  const { host, close } = mount(editor)
  try {
    const shape = host.querySelector('.ppt-editing-slide .ppt-object')!
    const path = shape.querySelector('svg path')!
    assert.ok(path)
    const fill = path.getAttribute('fill'),
      geometry = path.getAttribute('d')
    shape.dispatchEvent(
      new dom.window.MouseEvent('dblclick', { bubbles: true })
    )
    await flush()
    assert.equal(shape.querySelector('svg path')?.getAttribute('d'), geometry)
    assert.equal(shape.querySelector('svg path')?.getAttribute('fill'), fill)
    const input = shape.querySelector('textarea')!
    assert.ok(input)
    assert.ok(
      input.closest('.ppt-object-content'),
      'editor lives within the retained shape'
    )
    assert.ok(
      input.closest('[style*="text-align: center"]'),
      'editor inherits paragraph centering'
    )
  } finally {
    close()
  }
})

test('inline table editing retains the same padded, vertically centered content container', async () => {
  const { objectContent } = await import('../src/ui/scene.js')
  const meta = {
    style: {
      align: 'center' as const,
      fontSize: 28,
      color: '#ffffff',
      bold: true,
    },
    verticalAlign: 'center' as const,
    margins: { left: 12, right: 14, top: 8, bottom: 10 },
    fill: '#173f3b',
    rowSpan: 1,
    columnSpan: 1,
  }
  const object = {
    id: '2',
    part: 'slide.xml',
    kind: 'table' as const,
    name: 'Centered table',
    x: 0,
    y: 0,
    width: 300,
    height: 160,
    cells: [['A\nB']],
    tableCells: [[meta]],
  }
  const { shallowRef } = await import('vue')
  const editing = shallowRef(false)
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      objectContent(
        object,
        false,
        editing.value
          ? {
              kind: 'table',
              row: 0,
              column: 0,
              content: h('textarea', {
                value: 'A\nB',
                class: 'ppt-inline-cell-editor',
              }),
            }
          : undefined
      ),
  })
  app.mount(host)
  try {
    const cell = host.querySelector('[role=cell]') as HTMLElement
    const original = cell.querySelector(
      '.ppt-table-cell-content'
    ) as HTMLElement
    const padding = original.style.padding
    editing.value = true
    await flush()
    const input = cell.querySelector('textarea')!
    assert.ok(
      input.closest('.ppt-table-cell-content'),
      'editor retains the padded flex item'
    )
    assert.equal(
      (input.closest('.ppt-table-cell-content') as HTMLElement).style.padding,
      padding
    )
    assert.equal(cell.style.justifyContent, 'center')
    assert.equal(cell.style.textAlign, 'center')
    assert.equal(cell.style.background, 'rgb(23, 63, 59)')
  } finally {
    app.unmount()
    host.remove()
  }
})
