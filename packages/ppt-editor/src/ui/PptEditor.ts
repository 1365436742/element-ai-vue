import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  type PropType,
  type VNode,
} from 'vue'
import { EditorController } from '../controller.js'
import type {
  Command,
  PptEditorOptions,
  PptSource,
  SceneObject,
  ScenePage,
  TextStyle,
} from '../types.js'
import { icon } from './icons.js'
import { AssetInspector } from './AssetInspector.js'
import { TableInspector } from './TableInspector.js'
import { CanvasGestures } from './gestures.js'
import {
  SceneObjectView,
  SlidePreview,
  objectPosition,
  type CanvasEditor,
} from './scene.js'
import { reconcile } from './reconcile.js'
import { paintLayer } from './paint.js'

export const PptEditor = defineComponent({
  name: 'PptEditor',
  props: {
    source: { type: [String, Object] as PropType<PptSource> },
    editable: { type: Boolean, default: true },
    options: {
      type: Object as PropType<PptEditorOptions>,
      default: () => ({}),
    },
    controller: { type: Object as PropType<EditorController> },
  },
  emits: ['ready', 'change', 'error'],
  setup(props, { emit, expose, slots }) {
    const editor =
      props.controller ??
      new EditorController({ ...props.options, editable: props.editable })
    const state = shallowRef(editor.getState()),
      pagePart = ref(''),
      selected = ref(''),
      panel = ref(false),
      pagesOpen = ref(false),
      modal = ref<'url' | 'table' | undefined>(),
      tableRows = ref(3),
      tableColumns = ref(3),
      mobile = ref(false),
      textInput = ref<HTMLTextAreaElement>(),
      url = ref(''),
      toast = ref(''),
      zoom = ref(0),
      pan = ref({ x: 0, y: 0 }),
      fit = ref(0.7),
      container = ref<HTMLElement>(),
      fileInput = ref<HTMLInputElement>(),
      imageInput = ref<HTMLInputElement>(),
      editText = ref<string>(),
      editingId = ref(''),
      draftFrame = ref<{
        id: string
        x: number
        y: number
        width: number
        height: number
        rotation?: number
      }>(),
      presenting = ref(false)
    const inlineEdit = shallowRef<{
      object: SceneObject
      kind: 'table' | 'diagram'
      row?: number
      column?: number
      nodeId?: string
      original: string
      revision: number
      style?: TextStyle
    }>()
    const inlineValue = ref(''),
      inlineError = ref(''),
      inlineBusy = ref(false)
    const inlineInput = ref<HTMLTextAreaElement>()
    const resourceInput = ref<HTMLInputElement>()
    const resourceTarget = shallowRef<{
      object: SceneObject
      revision: number
    }>()
    let inlineComposing = false
    let resize: ResizeObserver | undefined,
      toastTimer: ReturnType<typeof setTimeout> | undefined,
      unsubscribe: () => void
    let drag:
      | {
          id: string
          pointer: number
          startX: number
          startY: number
          object: SceneObject
          resize: boolean
          captureTarget: HTMLElement
        }
      | undefined
    const gestures = new CanvasGestures()
    let spaceHeld = false
    let composing = false
    const replacement = ref('')
    let textSession: ReturnType<EditorController['beginTextSession']>
    const textDraft = ref('')
    const scene = computed(() => state.value.scene)
    const pages = computed(() =>
      state.value.workspace === 'master'
        ? [...scene.value.masters, ...scene.value.layouts]
        : scene.value.slides
    )
    const page = computed(
      () => pages.value.find((p) => p.part === pagePart.value) ?? pages.value[0]
    )
    const object = computed(() =>
      page.value?.objects.find((o) => o.id === selected.value && !o.inherited)
    )
    const scale = computed(() => zoom.value || fit.value)
    const writable = computed(() => state.value.editable && !presenting.value)
    const notify = (message: string) => {
      toast.value = message
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => (toast.value = ''), 4000)
    }
    const fail = (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      notify(message)
      emit('error', error)
    }
    const run = async (command: Command) => {
      if (!writable.value || (inlineEdit.value && !(await commitInline())))
        return
      try {
        return await editor.execute(command)
      } catch (error) {
        fail(error)
      }
    }
    const choose = async (target: ScenePage) => {
      if (inlineEdit.value && !(await commitInline())) return
      if (editingId.value) await commitText()
      pagePart.value = target.part
      selected.value = ''
      pagesOpen.value = false
    }
    async function commitInline(): Promise<boolean> {
      const edit = inlineEdit.value
      if (!edit) return true
      if (inlineBusy.value || inlineComposing) return false
      if (inlineValue.value === edit.original) {
        inlineEdit.value = undefined
        return true
      }
      if (!writable.value) {
        inlineError.value = '当前不可编辑，草稿已保留'
        return false
      }
      inlineBusy.value = true
      try {
        if (state.value.revision !== edit.revision)
          throw Error('文档已变化，草稿已保留。请复制文字后取消，再重新编辑。')
        if (edit.kind === 'table')
          await setCell(
            edit.object,
            edit.row!,
            edit.column!,
            inlineValue.value,
            edit.original,
            edit.revision
          )
        else
          await editor.execute({
            type: 'diagram.text.set',
            ref: edit.object,
            nodeId: edit.nodeId!,
            text: inlineValue.value,
          })
        inlineEdit.value = undefined
        inlineError.value = ''
        return true
      } catch (error) {
        inlineError.value =
          error instanceof Error ? error.message : String(error)
        return false
      } finally {
        inlineBusy.value = false
      }
    }
    async function editCanvas(event: MouseEvent, target: SceneObject) {
      if (!writable.value || target.inherited) return
      const hit = event.target as Element
      const cell = hit.closest('[data-ppt-row]') as HTMLElement | null
      const node = hit.closest('[data-ppt-diagram-node]') as HTMLElement | null
      if (!(await commitInline())) return
      await commitText()
      const current = page.value?.objects.find(
        (o) => o.id === target.id && o.part === target.part && !o.inherited
      )
      if (!current || !writable.value) return
      target = current
      if (target.kind === 'image') {
        replaceResource(target)
        return
      }
      if (target.kind === 'table' && cell) {
        const row = Number(cell.dataset.pptRow),
          column = Number(cell.dataset.pptColumn)
        inlineEdit.value = {
          object: target,
          kind: 'table',
          row,
          column,
          original: target.cells?.[row]?.[column] ?? '',
          revision: state.value.revision,
          style: target.tableCells?.[row]?.[column]?.style,
        }
      } else if (target.kind === 'diagram' && node) {
        const id = node.dataset.pptDiagramNode,
          source = target.diagramTexts?.find((text) => text.id === id)
        if (!source) return
        inlineEdit.value = {
          object: target,
          kind: 'diagram',
          nodeId: id,
          original: source.text,
          revision: state.value.revision,
          style: target.children?.find((child) => child.diagramNodeId === id)
            ?.richText?.paragraphs[0]?.runs[0]?.style,
        }
      } else {
        edit(target)
        return
      }
      selected.value = target.id
      panel.value = false
      inlineValue.value = inlineEdit.value.original
      inlineError.value = ''
      await nextTick()
      inlineInput.value?.focus()
    }
    function replaceResource(target: SceneObject) {
      if (!writable.value) return
      resourceTarget.value = { object: target, revision: state.value.revision }
      void nextTick(() => resourceInput.value?.click())
    }
    async function replaceFile(event: Event) {
      const input = event.target as HTMLInputElement,
        file = input.files?.[0],
        snapshot = resourceTarget.value
      try {
        if (!file || !snapshot || !writable.value) return
        const data = new Uint8Array(await file.arrayBuffer())
        if (state.value.revision !== snapshot.revision)
          throw Error('文档已变化，请重新选择要替换的资源')
        await run({
          type: 'resource.replace',
          ref: snapshot.object,
          data,
          mimeType: file.type,
        })
      } catch (error) {
        fail(error)
      } finally {
        input.value = ''
        resourceTarget.value = undefined
      }
    }
    function canvasEditor(target: SceneObject): CanvasEditor | undefined {
      const edit = inlineEdit.value
      if (
        !edit ||
        edit.object.id !== target.id ||
        edit.object.part !== target.part
      )
        return undefined
      return {
        kind: edit.kind,
        row: edit.row,
        column: edit.column,
        nodeId: edit.nodeId,
        content: h('textarea', {
          ref: inlineInput,
          class: 'ppt-inline-cell-editor',
          value: inlineValue.value,
          'aria-label':
            edit.kind === 'table'
              ? `编辑单元格 ${edit.row! + 1} · ${edit.column! + 1}`
              : '编辑 SmartArt 节点',
          readOnly: !writable.value || inlineBusy.value,
          onInput: (e: Event) => {
            inlineValue.value = (e.target as HTMLTextAreaElement).value
          },
          onBlur: () => void commitInline(),
          onPointerdown: (e: Event) => e.stopPropagation(),
          onDblclick: (e: Event) => e.stopPropagation(),
          onCompositionstart: () => {
            inlineComposing = true
          },
          onCompositionend: () => {
            inlineComposing = false
          },
          onKeydown: (e: KeyboardEvent) => {
            e.stopPropagation()
            if (e.isComposing || inlineComposing) return
            if (e.key === 'Escape' && !inlineBusy.value) {
              e.preventDefault()
              inlineEdit.value = undefined
              inlineError.value = ''
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              void commitInline()
            }
          },
        }),
      }
    }
    async function enterPresentation() {
      if (!(await commitInline()) || composing) return
      await commitText()
      pointerCancel()
      gestures.reset()
      spaceHeld = false
      selected.value = ''
      panel.value = false
      if (state.value.workspace === 'master') editor.setWorkspace('slides')
      presenting.value = true
      fitCanvas()
      await nextTick()
      container.value?.focus()
    }
    function stepPresentation(direction: number) {
      const index = pages.value.findIndex((p) => p.part === page.value?.part)
      const next = Math.max(
        0,
        Math.min(pages.value.length - 1, index + direction)
      )
      if (next !== index) void choose(pages.value[next]!)
    }
    const update = (
      patch: Extract<Command, { type: 'object.update' }>['patch']
    ) =>
      object.value &&
      run({
        type: 'object.update',
        ref: { part: object.value.part, id: object.value.id },
        patch,
      })
    const style = (patch: TextStyle) => update({ style: patch })
    async function commitText() {
      if (!editingId.value || composing) return
      const target = page.value?.objects.find(
        (o) => o.id === editingId.value && !o.inherited
      )
      const value = editText.value
      editingId.value = ''
      if (target && value !== undefined && value !== target.text) {
        try {
          await editor.commitTextSession(
            textSession,
            { part: target.part, id: target.id },
            value
          )
          textDraft.value = ''
        } catch (error) {
          textDraft.value = value
          fail(error)
        }
      }
      if (!target && value) textDraft.value = value
      textSession = undefined
    }
    function edit(object: SceneObject) {
      if (
        !writable.value ||
        object.inherited ||
        !['text', 'shape'].includes(object.kind)
      )
        return
      selected.value = object.id
      panel.value = false
      textSession = editor.beginTextSession(object)
      editingId.value = object.id
      editText.value = object.text ?? ''
      void nextTick(() => textInput.value?.focus())
    }
    function canvasPointerDown(event: PointerEvent) {
      if (presenting.value) return
      const control = (event.target as HTMLElement).closest(
        'button,input,textarea,select,video,audio'
      )
      if (control && !control.classList.contains('ppt-resize-handle')) return
      const touch = event.pointerType === 'touch'
      const mousePan = event.button === 1 || (event.button === 0 && spaceHeld)
      if (!touch && !mousePan) return
      const node = event.currentTarget as HTMLElement
      const rect = node.getBoundingClientRect()
      const background = !(event.target as HTMLElement).closest('.ppt-object')
      if (
        gestures.begin(
          event.pointerId,
          { x: event.clientX, y: event.clientY },
          mousePan || background,
          {
            scale: scale.value,
            ...pan.value,
            center: {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            },
          }
        )
      ) {
        pointerCancel()
        if (background) {
          selected.value = ''
          void commitText()
        }
        event.preventDefault()
        event.stopPropagation()
        for (const id of gestures.pointerIds) node.setPointerCapture(id)
      }
    }
    function canvasPointerMove(event: PointerEvent) {
      const view = gestures.move(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })
      if (gestures.active) {
        event.preventDefault()
        event.stopPropagation()
      }
      if (view) {
        zoom.value = view.scale
        pan.value = { x: view.x, y: view.y }
      }
    }
    function canvasPointerEnd(event: PointerEvent) {
      const active = gestures.active
      gestures.end(event.pointerId)
      if (active) {
        event.preventDefault()
        event.stopPropagation()
        pointerCancel()
      }
    }
    function fitCanvas() {
      zoom.value = 0
      pan.value = { x: 0, y: 0 }
      gestures.reset()
    }
    function pointerDown(
      event: PointerEvent,
      target: SceneObject,
      resizing = false
    ) {
      if (
        event.button !== 0 ||
        target.inherited ||
        !writable.value ||
        editingId.value === target.id
      )
        return
      if (inlineEdit.value) {
        void commitInline()
        return
      }
      event.preventDefault()
      event.stopPropagation()
      void commitText()
      selected.value = target.id
      const node = event.currentTarget as HTMLElement
      // Capture only once movement starts; capturing a click retargets the
      // browser's dblclick from its table cell / diagram node to the wrapper.
      drag = {
        id: target.id,
        pointer: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        object: { ...target },
        resize: resizing,
        captureTarget: node,
      }
    }
    function pointerMove(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.pointer) return
      if (event.buttons === 0) {
        pointerCancel()
        return
      }
      if (event.clientX === drag.startX && event.clientY === drag.startY) return
      drag.captureTarget.setPointerCapture(event.pointerId)
      const dx = (event.clientX - drag.startX) / scale.value,
        dy = (event.clientY - drag.startY) / scale.value,
        o = drag.object
      draftFrame.value = {
        id: o.id,
        x: drag.resize ? o.x : o.x + dx,
        y: drag.resize ? o.y : o.y + dy,
        width: drag.resize ? Math.max(16, o.width + dx) : o.width,
        height: drag.resize ? Math.max(16, o.height + dy) : o.height,
      }
    }
    function pointerUp(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.pointer) return
      const frame = draftFrame.value,
        original = drag.object
      drag = undefined
      draftFrame.value = undefined
      if (frame && writable.value)
        void run({
          type: 'object.update',
          ref: { part: original.part, id: original.id },
          patch: {
            x: Math.round(frame.x),
            y: Math.round(frame.y),
            width: Math.round(frame.width),
            height: Math.round(frame.height),
          },
        })
    }
    function pointerCancel() {
      drag = undefined
      draftFrame.value = undefined
    }
    async function addTable() {
      if (!page.value) return
      await commitText()
      const result = await run({
        type: 'table.add',
        part: page.value.part,
        cells: Array.from({ length: tableRows.value }, () =>
          Array.from({ length: tableColumns.value }, () => '')
        ),
        frame: {
          x: scene.value.width * 0.15,
          y: scene.value.height * 0.2,
          width: scene.value.width * 0.7,
          height: Math.min(scene.value.height * 0.6, tableRows.value * 60),
        },
      })
      if (result?.ref) {
        selected.value = result.ref.id
        panel.value = true
        modal.value = undefined
      }
    }
    async function setCell(
      target: SceneObject,
      row: number,
      column: number,
      value: string,
      original: string,
      revision?: number
    ) {
      if (revision !== undefined && editor.getState().revision !== revision)
        throw new Error(
          '文档版本已改变，文字草稿已保留；请复制后还原并重新编辑'
        )
      const current = editor.getState().scene
      const table = [...current.slides, ...current.layouts, ...current.masters]
        .find((p) => p.part === target.part)
        ?.objects.find((o) => o.id === target.id && !o.inherited)
      if (!table?.cells?.[row] || table.cells[row][column] === undefined)
        throw new Error('表格已被删除或结构已改变，文字草稿已保留')
      if (
        table.cells[row][column] !== original &&
        table.cells[row][column] !== value
      )
        throw new Error(
          '此单元格已被其他成员修改，文字草稿已保留；可复制后还原并重新编辑'
        )
      const cells = table.cells.map((cells) => [...cells])
      cells[row]![column] = value
      await editor.execute({ type: 'table.set', ref: target, cells })
    }
    async function add(kind: 'text' | 'shape', geometry = 'rect') {
      if (!page.value) return
      await commitText()
      const result = await run({
        type: 'object.add',
        part: page.value.part,
        object: {
          kind,
          frame: {
            x: scene.value.width * 0.2,
            y: scene.value.height * 0.3,
            width: kind === 'text' ? 480 : 240,
            height: kind === 'text' ? 96 : 180,
          },
          text: kind === 'text' ? '在这里输入文字' : undefined,
          style: { fontSize: 36, color: '#203038' },
          fill: kind === 'shape' ? '#e78348' : undefined,
          geometry,
        },
      })
      if (result?.ref) selected.value = result.ref.id
    }
    async function copyPage() {
      if (!page.value) return
      const type =
        state.value.workspace === 'slides'
          ? 'slide.duplicate'
          : scene.value.masters.some((m) => m.part === page.value!.part)
            ? 'master.duplicate'
            : 'layout.duplicate'
      const result = await run({ type, part: page.value.part })
      if (result?.part) pagePart.value = result.part
    }
    async function deletePage() {
      if (!page.value) return
      const type =
        state.value.workspace === 'slides'
          ? 'slide.delete'
          : scene.value.masters.some((m) => m.part === page.value!.part)
            ? 'master.delete'
            : 'layout.delete'
      await run(
        type === 'slide.delete'
          ? { type, part: page.value.part }
          : {
              type,
              part: page.value.part,
              replacementPart: replacement.value || undefined,
            }
      )
    }
    async function placeholder() {
      if (!page.value) return
      const index =
        Math.max(
          -1,
          ...page.value.objects.map((o) =>
            Number(o.placeholder?.split(':')[1] ?? -1)
          )
        ) + 1
      const result = await run({
        type: 'object.add',
        part: page.value.part,
        object: {
          kind: 'text',
          text: '单击编辑占位符',
          frame: { x: 80, y: 100, width: 600, height: 120 },
          style: { fontSize: 40 },
        },
      })
      if (result?.ref) {
        selected.value = result.ref.id
        await run({
          type: 'placeholder.set',
          ref: result.ref,
          placeholderType: 'body',
          index,
        })
      }
    }
    async function importFile(event: Event, isImage = false) {
      const input = event.target as HTMLInputElement,
        file = input.files?.[0]
      if (!file) return
      try {
        if (isImage && page.value) {
          if (
            !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(
              file.type
            )
          )
            throw new Error('请选择 PNG、JPEG、WebP 或 GIF 图片')
          if (file.size > 20 * 1024 * 1024)
            throw new Error('图片不能超过 20 MB')
          const bitmap = await createImageBitmap(file)
          const width = Math.min(bitmap.width, scene.value.width * 0.6),
            height = (width * bitmap.height) / bitmap.width
          bitmap.close()
          const result = await run({
            type: 'object.add',
            part: page.value.part,
            object: {
              kind: 'image',
              name: file.name,
              frame: { x: 80, y: 80, width, height },
              data: new Uint8Array(await file.arrayBuffer()),
              mimeType: file.type,
            },
          })
          if (result?.ref) selected.value = result.ref.id
        } else {
          await commitText()
          await editor.open(file)
          pagePart.value = ''
          selected.value = ''
          notify('演示文稿已打开')
        }
      } catch (error) {
        fail(error)
      } finally {
        input.value = ''
      }
    }
    async function download() {
      try {
        if (!(await commitInline())) return
        await commitText()
        const blob = await editor.exportFile(),
          link = document.createElement('a'),
          href = URL.createObjectURL(blob)
        link.href = href
        link.download = `${scene.value.title || '演示文稿'}.pptx`
        link.click()
        setTimeout(() => URL.revokeObjectURL(href), 30000)
        notify('已导出标准 PPTX 文件')
      } catch (error) {
        fail(error)
      }
    }
    function keydown(event: KeyboardEvent) {
      if (presenting.value) {
        if (event.key === 'Escape') {
          event.preventDefault()
          presenting.value = false
          return
        }
        if (
          (event.target as Element).closest(
            'input,textarea,select,video,audio,button,a,[role=button],[contenteditable=true]'
          )
        )
          return
        if (
          [
            'ArrowRight',
            'ArrowDown',
            'PageDown',
            ' ',
            'ArrowLeft',
            'ArrowUp',
            'PageUp',
            'Home',
            'End',
          ].includes(event.key)
        ) {
          event.preventDefault()
          if (event.key === 'Home') void choose(pages.value[0]!)
          else if (event.key === 'End') void choose(pages.value.at(-1)!)
          else
            stepPresentation(
              ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key) ? -1 : 1
            )
        }
        return
      }
      if (
        (event.target as HTMLElement).closest(
          'input,textarea,select,button,[contenteditable=true],[role=button]'
        )
      )
        return
      if (event.code === 'Space') {
        spaceHeld = true
        event.preventDefault()
        return
      }
      const mod = event.ctrlKey || event.metaKey
      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void download()
        return
      }
      if (!writable.value) return
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        void (event.shiftKey ? editor.redo() : editor.undo()).catch(fail)
      }
      if (event.key === 'Escape') {
        selected.value = ''
        presenting.value = false
        panel.value = false
      }
      if (
        object.value &&
        (event.key === 'Delete' || event.key === 'Backspace')
      ) {
        event.preventDefault()
        void run({ type: 'object.delete', ref: object.value })
        selected.value = ''
      }
      if (object.value && event.key.startsWith('Arrow')) {
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        void update({
          x:
            object.value.x +
            (event.key === 'ArrowRight'
              ? step
              : event.key === 'ArrowLeft'
                ? -step
                : 0),
          y:
            object.value.y +
            (event.key === 'ArrowDown'
              ? step
              : event.key === 'ArrowUp'
                ? -step
                : 0),
        })
      }
    }
    const btn = (
      label: string,
      glyph: string,
      action: () => unknown,
      disabled = false,
      extra = ''
    ) =>
      h(
        'button',
        {
          type: 'button',
          class: ['ppt-button', extra],
          title: label,
          'aria-label': label,
          disabled,
          onClick: action,
        },
        [icon(glyph), h('span', label)]
      )
    const tool = (
      label: string,
      glyph: string,
      action: () => unknown,
      disabled = false
    ) => btn(label, glyph, action, disabled, 'ppt-tool')
    function field(
      label: string,
      value: number,
      action: (n: number) => void,
      min?: number,
      max?: number
    ) {
      return h('label', { class: 'ppt-field' }, [
        h('span', label),
        h('input', {
          type: 'number',
          value: Math.round(value * 10) / 10,
          min,
          max,
          disabled: !writable.value,
          onChange: (e: Event) => {
            const n = Number((e.target as HTMLInputElement).value)
            if (
              Number.isFinite(n) &&
              (min === undefined || n >= min) &&
              (max === undefined || n <= max)
            )
              action(n)
          },
        }),
      ])
    }
    function colorField(
      label: string,
      value: string,
      action: (color: string) => void
    ) {
      return h('label', { class: 'ppt-color-field' }, [
        h('span', label),
        h('span', { class: 'ppt-color-value' }, [
          h('input', {
            type: 'color',
            value: /^#[\da-f]{6}$/i.test(value) ? value : '#ffffff',
            disabled: !writable.value,
            onInput: (event: Event) =>
              action((event.target as HTMLInputElement).value),
          }),
          value.toUpperCase(),
        ]),
      ])
    }
    function inspector(): VNode {
      const o = object.value
      return h(
        'aside',
        {
          class: ['ppt-inspector', { open: panel.value }],
          'aria-label': '属性面板',
        },
        [
          h('div', { class: 'ppt-panel-heading' }, [
            h('div', [
              h('span', { class: 'ppt-eyebrow' }, 'DESIGN'),
              h('h3', o ? '对象属性' : '页面设计'),
            ]),
            btn(
              '关闭属性',
              'close',
              () => (panel.value = false),
              false,
              'ppt-mobile-only ppt-icon-only'
            ),
          ]),
          o
            ? h('div', { class: 'ppt-inspector-body' }, [
                h('div', { class: 'ppt-object-heading' }, [
                  icon(
                    o.kind === 'text'
                      ? 'text'
                      : o.kind === 'image'
                        ? 'image'
                        : 'square'
                  ),
                  h('strong', o.name || '未命名对象'),
                ]),
                h('section', { class: 'ppt-property-group' }, [
                  h('h4', '位置与尺寸'),
                  h('div', { class: 'ppt-field-grid' }, [
                    field('X', o.x, (x) => void update({ x })),
                    field('Y', o.y, (y) => void update({ y })),
                    field(
                      '宽度',
                      o.width,
                      (width) => void update({ width }),
                      1
                    ),
                    field(
                      '高度',
                      o.height,
                      (height) => void update({ height }),
                      1
                    ),
                    field(
                      '旋转',
                      o.rotation ?? 0,
                      (rotation) => void update({ rotation })
                    ),
                  ]),
                ]),
                ['text', 'shape'].includes(o.kind)
                  ? h('section', { class: 'ppt-property-group' }, [
                      h('h4', '文字'),
                      btn('编辑文字', 'text', () => edit(o), !writable.value),
                      h('label', { class: 'ppt-field' }, [
                        h('span', '字体'),
                        h(
                          'select',
                          {
                            value: o.style?.fontFamily ?? 'Noto Sans SC',
                            disabled: !writable.value,
                            onChange: (e: Event) =>
                              void style({
                                fontFamily: (e.target as HTMLSelectElement)
                                  .value,
                              }),
                          },
                          [
                            'Noto Sans SC',
                            'PingFang SC',
                            'Microsoft YaHei',
                            'Arial',
                            'Georgia',
                            'Times New Roman',
                          ].map((name) => h('option', { value: name }, name))
                        ),
                      ]),
                      field(
                        '字号',
                        o.style?.fontSize ?? 24,
                        (fontSize) => void style({ fontSize }),
                        1,
                        400
                      ),
                      h('div', { class: 'ppt-format-row' }, [
                        h(
                          'button',
                          {
                            class: { active: o.style?.bold },
                            disabled: !writable.value,
                            onClick: () => void style({ bold: !o.style?.bold }),
                            'aria-label': '加粗',
                          },
                          h('b', 'B')
                        ),
                        h(
                          'button',
                          {
                            class: { active: o.style?.italic },
                            disabled: !writable.value,
                            onClick: () =>
                              void style({ italic: !o.style?.italic }),
                            'aria-label': '斜体',
                          },
                          h('i', 'I')
                        ),
                        h(
                          'button',
                          {
                            class: { active: o.style?.underline },
                            disabled: !writable.value,
                            onClick: () =>
                              void style({ underline: !o.style?.underline }),
                            'aria-label': '下划线',
                          },
                          h('u', 'U')
                        ),
                      ]),
                      colorField(
                        '文字颜色',
                        o.style?.color ?? '#203038',
                        (color) => void style({ color })
                      ),
                      h('label', { class: 'ppt-field' }, [
                        h('span', '对齐'),
                        h(
                          'select',
                          {
                            value: o.style?.align ?? 'left',
                            disabled: !writable.value,
                            onChange: (e: Event) =>
                              void style({
                                align: (e.target as HTMLSelectElement)
                                  .value as TextStyle['align'],
                              }),
                          },
                          [
                            ['left', '左对齐'],
                            ['center', '居中'],
                            ['right', '右对齐'],
                          ].map(([value, label]) =>
                            h('option', { value }, label)
                          )
                        ),
                      ]),
                    ])
                  : null,
                ['image', 'media'].includes(o.kind)
                  ? h(AssetInspector, {
                      key: `${o.part}:${o.id}`,
                      object: o,
                      editable: writable.value,
                      execute: (command: Command) => editor.execute(command),
                    })
                  : null,
                o.kind === 'table'
                  ? h(TableInspector, {
                      key: `${o.part}:${o.id}`,
                      object: o,
                      contentEditing: false,
                      editable: writable.value && !inlineEdit.value,
                      revision: state.value.revision,
                      structure: async (
                        axis: 'row' | 'column',
                        action: 'insert' | 'delete',
                        index: number
                      ) => {
                        await editor.execute({
                          type: 'table.structure',
                          ref: o,
                          axis,
                          action,
                          index,
                        })
                      },
                      commit: (
                        row: number,
                        column: number,
                        value: string,
                        original: string,
                        revision?: number
                      ) => setCell(o, row, column, value, original, revision),
                    })
                  : null,
                state.value.workspace === 'master' &&
                ['text', 'shape'].includes(o.kind)
                  ? h('section', { class: 'ppt-property-group' }, [
                      h('h4', '占位符'),
                      h(
                        'select',
                        {
                          class: 'ppt-select',
                          value: o.placeholder?.split(':')[0] ?? '',
                          disabled: !writable.value,
                          onChange: (e: Event) =>
                            run({
                              type: 'placeholder.set',
                              ref: o,
                              placeholderType: (e.target as HTMLSelectElement)
                                .value,
                              index: Number(o.placeholder?.split(':')[1] ?? 0),
                            }),
                        },
                        [
                          ['', '普通对象'],
                          ['title', '标题'],
                          ['body', '正文'],
                          ['subTitle', '副标题'],
                          ['ftr', '页脚'],
                          ['sldNum', '页码'],
                          ['dt', '日期'],
                          ['pic', '图片'],
                        ].map(([value, label]) =>
                          h('option', { value, disabled: !value }, label)
                        )
                      ),
                      o.placeholder
                        ? field(
                            '占位符编号',
                            Number(o.placeholder.split(':')[1]),
                            (index) =>
                              void run({
                                type: 'placeholder.set',
                                ref: o,
                                placeholderType: o.placeholder!.split(':')[0]!,
                                index,
                              }),
                            0
                          )
                        : null,
                    ])
                  : null,
                o.kind === 'shape'
                  ? h('section', { class: 'ppt-property-group' }, [
                      h('h4', '外观'),
                      colorField(
                        '填充',
                        o.fill ?? '#ffffff',
                        (fill) => void update({ fill })
                      ),
                      colorField(
                        '描边',
                        o.stroke ?? '#ffffff',
                        (stroke) => void update({ stroke })
                      ),
                    ])
                  : null,
                h('section', { class: 'ppt-property-group' }, [
                  h('h4', '排列'),
                  h('div', { class: 'ppt-button-grid' }, [
                    tool(
                      '置于顶层',
                      'layers',
                      () =>
                        run({
                          type: 'object.reorder',
                          ref: o,
                          direction: 'front',
                        }),
                      !writable.value
                    ),
                    tool(
                      '置于底层',
                      'layers',
                      () =>
                        run({
                          type: 'object.reorder',
                          ref: o,
                          direction: 'back',
                        }),
                      !writable.value
                    ),
                    tool(
                      '水平居中',
                      'align',
                      () => update({ x: (scene.value.width - o.width) / 2 }),
                      !writable.value
                    ),
                    tool(
                      '删除对象',
                      'trash',
                      () => {
                        void run({ type: 'object.delete', ref: o })
                        selected.value = ''
                      },
                      !writable.value
                    ),
                  ]),
                ]),
              ])
            : h('div', { class: 'ppt-inspector-body' }, [
                h('div', { class: 'ppt-ratio' }, [
                  h('div', { class: 'ppt-ratio-preview' }, '16:9'),
                  h('div', [
                    h('strong', '宽屏演示文稿'),
                    h(
                      'small',
                      `${Math.round(scene.value.width)} × ${Math.round(scene.value.height)} px`
                    ),
                  ]),
                ]),
                h('section', { class: 'ppt-property-group' }, [
                  h('h4', '画布'),
                  page.value
                    ? h('label', { class: 'ppt-field' }, [
                        h('span', '页面名称'),
                        h('input', {
                          value: page.value.name,
                          disabled: !writable.value,
                          onChange: (e: Event) =>
                            run({
                              type: 'page.rename',
                              part: page.value!.part,
                              name: (e.target as HTMLInputElement).value,
                            }),
                        }),
                      ])
                    : null,
                  page.value
                    ? colorField(
                        '背景颜色',
                        page.value.background,
                        (color) =>
                          void run({
                            type: 'page.background',
                            part: page.value!.part,
                            color,
                          })
                      )
                    : null,
                  h(
                    'div',
                    { class: 'ppt-swatches' },
                    [
                      '#ffffff',
                      '#f7f4ed',
                      '#172c35',
                      '#173f3b',
                      '#e9ecf0',
                      '#f2d7c3',
                    ].map((color) =>
                      h('button', {
                        style: { background: color },
                        title: color,
                        'aria-label': `背景 ${color}`,
                        disabled: !writable.value,
                        onClick: () =>
                          page.value &&
                          run({
                            type: 'page.background',
                            part: page.value.part,
                            color,
                          }),
                      })
                    )
                  ),
                ]),
                state.value.workspace === 'slides'
                  ? h('section', { class: 'ppt-property-group' }, [
                      h('h4', '版式'),
                      h(
                        'select',
                        {
                          class: 'ppt-select',
                          value: page.value?.layoutPart,
                          disabled: !writable.value,
                          onChange: (e: Event) =>
                            page.value &&
                            run({
                              type: 'layout.apply',
                              part: page.value.part,
                              layoutPart: (e.target as HTMLSelectElement).value,
                            }),
                        },
                        scene.value.layouts.map((layout) =>
                          h(
                            'option',
                            { value: layout.part },
                            layout.name || layout.part
                          )
                        )
                      ),
                      btn(
                        '重置版式',
                        'undo',
                        () =>
                          page.value &&
                          run({ type: 'layout.reset', part: page.value.part }),
                        !writable.value
                      ),
                      btn('编辑母版与布局', 'layers', () => {
                        editor.setWorkspace('master')
                        pagePart.value = ''
                        selected.value = ''
                      }),
                    ])
                  : h('section', { class: 'ppt-property-group' }, [
                      h('h4', '母版工作区'),
                      h(
                        'p',
                        { class: 'ppt-help' },
                        '在母版中添加元素，引用它的页面会同步显示。选择布局可单独编辑该版式。'
                      ),
                      btn(
                        '新增母版',
                        'plus',
                        async () => {
                          const result = await run({ type: 'master.add' })
                          if (result?.part) pagePart.value = result.part
                        },
                        !writable.value
                      ),
                      btn(
                        '新增布局',
                        'grid',
                        async () => {
                          const masterPart =
                            page.value?.masterPart ??
                            scene.value.masters.find(
                              (m) => m.part === page.value?.part
                            )?.part ??
                            scene.value.masters[0]?.part
                          if (masterPart) {
                            const result = await run({
                              type: 'layout.add',
                              masterPart,
                            })
                            if (result?.part) pagePart.value = result.part
                          }
                        },
                        !writable.value
                      ),
                      btn('添加占位符', 'text', placeholder, !writable.value),
                      btn('复制模板', 'copy', copyPage, !writable.value),
                      h('label', { class: 'ppt-field' }, [
                        h('span', '删除时迁移至'),
                        h(
                          'select',
                          {
                            value: replacement.value,
                            onChange: (e: Event) =>
                              (replacement.value = (
                                e.target as HTMLSelectElement
                              ).value),
                          },
                          [
                            h('option', { value: '' }, '未引用时直接删除'),
                            ...(scene.value.masters.some(
                              (m) => m.part === page.value?.part
                            )
                              ? scene.value.masters
                              : scene.value.layouts
                            )
                              .filter((p) => p.part !== page.value?.part)
                              .map((p) =>
                                h('option', { value: p.part }, p.name)
                              ),
                          ]
                        ),
                      ]),
                      btn('删除模板', 'trash', deletePage, !writable.value),
                      colorField(
                        '主题强调色',
                        '#e78348',
                        (color) =>
                          void run({
                            type: 'theme.update',
                            colors: { accent1: color },
                          })
                      ),
                    ]),
                h('div', { class: 'ppt-tip' }, [
                  icon('pointer', 20),
                  h('p', '选择画布上的元素调整属性。双击文字开始编辑。'),
                ]),
                scene.value.diagnostics.length
                  ? h('details', { class: 'ppt-diagnostics' }, [
                      h(
                        'summary',
                        `${scene.value.diagnostics.length} 项兼容性提示`
                      ),
                      ...scene.value.diagnostics.map((d) => h('p', d.message)),
                    ])
                  : null,
              ]),
        ]
      )
    }
    const updateMobile = () => {
      mobile.value = window.matchMedia('(max-width: 760px)').matches
    }
    onMounted(() => {
      updateMobile()
      window.addEventListener('resize', updateMobile)
      window.addEventListener('pointerup', pointerUp)
      window.addEventListener('pointercancel', pointerCancel)
      window.addEventListener('blur', pointerCancel)
      unsubscribe = editor.subscribe((value) => {
        state.value = {
          ...value,
          scene: reconcile(state.value.scene, value.scene),
        }
        if (value.generation && value.scene.slides.length)
          pagePart.value = value.scene.slides.at(-1)!.part
        emit('change', value)
        if (!value.editable) {
          pointerCancel()
          if (editingId.value) {
            textDraft.value = editText.value ?? ''
            editingId.value = ''
          }
        }
      })
      resize = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect
        if (rect)
          fit.value = Math.max(
            0.1,
            Math.min(
              (rect.width - (mobile.value ? 24 : 80)) / scene.value.width,
              (rect.height - 100) / scene.value.height,
              1.25
            )
          )
      })
      if (container.value) resize.observe(container.value)
      const source = props.source ?? props.options.source
      if (source)
        void editor
          .open(source)
          .then(() => emit('ready', editor))
          .catch(fail)
      else emit('ready', editor)
    })
    watch(
      () => page.value?.part,
      () => {
        pan.value = { x: 0, y: 0 }
        gestures.reset()
      }
    )
    watch(
      () => props.source,
      (source) => {
        if (source) void editor.open(source).catch(fail)
      }
    )
    watch(
      () => props.editable,
      (value) => editor.setEditable(value)
    )
    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateMobile)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', pointerCancel)
      window.removeEventListener('blur', pointerCancel)
      unsubscribe?.()
      resize?.disconnect()
      clearTimeout(toastTimer)
      if (!props.controller) editor.destroy()
    })
    expose({
      subscribe: editor.subscribe.bind(editor),
      destroy: editor.destroy.bind(editor),
      open: editor.open.bind(editor),
      getState: editor.getState.bind(editor),
      execute: editor.execute.bind(editor),
      download,
      exportFile: editor.exportFile.bind(editor),
      exportDocument: editor.exportFile.bind(editor),
      applyGenerationEvent: editor.applyGenerationEvent.bind(editor),
      undo: editor.undo.bind(editor),
      redo: editor.redo.bind(editor),
      resolveDraft: editor.resolveDraft.bind(editor),
      cancelGeneration: editor.cancelGeneration.bind(editor),
      setWorkspace: editor.setWorkspace.bind(editor),
      controller: editor,
    })
    return () =>
      h(
        'div',
        {
          class: [
            'ppt-editor',
            {
              'is-presenting': presenting.value,
              'is-generating': !!state.value.generation,
            },
          ],
          'data-theme': props.options.theme ?? 'light',
          tabindex: 0,
          onKeydown: keydown,
          onKeyup: (event: KeyboardEvent) => {
            if (event.code === 'Space') spaceHeld = false
          },
          onFocusout: (event: FocusEvent) => {
            if (
              !(event.currentTarget as HTMLElement).contains(
                event.relatedTarget as Node | null
              )
            ) {
              spaceHeld = false
              gestures.reset()
            }
          },
        },
        [
          h('input', {
            ref: fileInput,
            type: 'file',
            accept: '.pptx,.ppt',
            hidden: true,
            onChange: (e: Event) => importFile(e),
          }),
          h('input', {
            ref: imageInput,
            type: 'file',
            accept: 'image/png,image/jpeg,image/webp,image/gif',
            hidden: true,
            onChange: (e: Event) => importFile(e, true),
          }),
          h('input', {
            ref: resourceInput,
            type: 'file',
            hidden: true,
            'aria-label': '替换画布资源',
            accept:
              resourceTarget.value?.object.kind === 'media'
                ? resourceTarget.value.object.mediaType === 'audio'
                  ? 'audio/mpeg'
                  : 'video/mp4'
                : 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml',
            onChange: replaceFile,
          }),
          h('header', { class: 'ppt-header' }, [
            h('div', { class: 'ppt-brand' }, [
              h('div', { class: 'ppt-brand-mark' }, 'P'),
              h('div', [
                h(
                  'div',
                  { class: 'ppt-document-title' },
                  scene.value.title === 'Untitled'
                    ? '未命名演示文稿'
                    : scene.value.title
                ),
                h('div', { class: 'ppt-document-meta' }, [
                  h('span', {
                    class: [
                      'ppt-status-dot',
                      { busy: state.value.phase !== 'ready' },
                    ],
                  }),
                  state.value.phase === 'generating'
                    ? '正在生成 · 编辑已锁定'
                    : state.value.phase === 'loading'
                      ? '正在打开文件'
                      : state.value.phase === 'error'
                        ? '需要处理'
                        : state.value.connection === 'connected'
                          ? `${state.value.peers?.length ?? 1} 人在线`
                          : state.value.connection
                            ? '协作连接中'
                            : '本地编辑',
                  h('span', { class: 'ppt-meta-divider' }, '/'),
                  'PPTX',
                ]),
              ]),
            ]),
            h('div', { class: 'ppt-header-actions' }, [
              slots.header?.({ editor, state: state.value }),
              btn(
                '打开',
                'upload',
                () => fileInput.value?.click(),
                state.value.phase === 'generating',
                'ppt-desktop-only'
              ),
              btn(
                '链接',
                'link',
                () => (modal.value = 'url'),
                state.value.phase === 'generating',
                'ppt-desktop-only ppt-icon-only'
              ),
              btn(
                '预览',
                'play',
                () => enterPresentation(),
                false,
                'ppt-preview-button'
              ),
              btn(
                '导出 PPTX',
                'download',
                download,
                state.value.phase !== 'ready',
                'ppt-button-primary'
              ),
            ]),
          ]),
          h('nav', { class: 'ppt-toolbar', 'aria-label': '编辑工具' }, [
            h('div', { class: 'ppt-workspace-tabs' }, [
              h(
                'button',
                {
                  class: { active: state.value.workspace === 'slides' },
                  onClick: () => {
                    editor.setWorkspace('slides')
                    pagePart.value = ''
                    selected.value = ''
                  },
                },
                '幻灯片'
              ),
              h(
                'button',
                {
                  class: { active: state.value.workspace === 'master' },
                  onClick: () => {
                    editor.setWorkspace('master')
                    pagePart.value = ''
                    selected.value = ''
                  },
                },
                '母版'
              ),
            ]),
            h('span', { class: 'ppt-divider' }),
            tool(
              '撤销',
              'undo',
              () => editor.undo().catch(fail),
              !writable.value || !state.value.canUndo
            ),
            tool(
              '重做',
              'redo',
              () => editor.redo().catch(fail),
              !writable.value || !state.value.canRedo
            ),
            h('span', { class: 'ppt-divider' }),
            tool('文字', 'text', () => add('text'), !writable.value),
            tool('形状', 'square', () => add('shape'), !writable.value),
            tool(
              '圆形',
              'square',
              () => add('shape', 'ellipse'),
              !writable.value
            ),
            tool(
              '图片',
              'image',
              () => imageInput.value?.click(),
              !writable.value
            ),
            tool(
              '表格',
              'table',
              () => {
                modal.value = 'table'
              },
              !writable.value
            ),
            h('div', { class: 'ppt-toolbar-spacer' }),
            h('span', { class: 'ppt-standard-badge' }, [
              icon('check', 13),
              '标准 OOXML',
            ]),
          ]),
          textDraft.value
            ? h('div', { class: 'ppt-error-banner' }, [
                h('span', '未提交的文字已保留：'),
                h('input', {
                  value: textDraft.value,
                  readonly: true,
                  'aria-label': '未提交文字草稿',
                }),
                btn('关闭', 'close', () => (textDraft.value = '')),
              ])
            : null,
          state.value.generation
            ? h('div', { class: 'ppt-generation-banner', role: 'status' }, [
                icon('spark'),
                h('div', [
                  h(
                    'strong',
                    state.value.phase === 'error'
                      ? '生成已中断'
                      : '正在生成演示文稿'
                  ),
                  h('span', '内容实时呈现，完成后恢复编辑'),
                ]),
                state.value.phase === 'error'
                  ? btn('保留草稿', 'check', () =>
                      editor.resolveDraft('accept')
                    )
                  : btn('停止生成', 'close', () => editor.cancelGeneration()),
                btn('放弃草稿', 'undo', () => editor.resolveDraft('discard')),
              ])
            : null,
          state.value.error && !state.value.generation
            ? h('div', { class: 'ppt-error-banner', role: 'alert' }, [
                icon('warning'),
                state.value.error,
                btn('返回文档', 'arrow', () => editor.resolveDraft('discard')),
              ])
            : null,
          h('div', { class: 'ppt-workbench' }, [
            h(
              'aside',
              {
                class: ['ppt-sidebar', { open: pagesOpen.value }],
                'aria-label': '页面导航',
              },
              [
                h('div', { class: 'ppt-sidebar-heading' }, [
                  h(
                    'span',
                    state.value.workspace === 'master' ? '母版与布局' : '幻灯片'
                  ),
                  h('span', { class: 'ppt-count' }, String(pages.value.length)),
                  btn(
                    '关闭导航',
                    'close',
                    () => (pagesOpen.value = false),
                    false,
                    'ppt-icon-only ppt-mobile-only'
                  ),
                ]),
                h(
                  'div',
                  { class: 'ppt-slide-list' },
                  pages.value.map((slide, index) =>
                    h(
                      'button',
                      {
                        class: [
                          'ppt-slide-item',
                          { active: page.value?.part === slide.part },
                        ],
                        onClick: () => choose(slide),
                        'aria-label': `${state.value.workspace === 'master' ? '母版布局' : '幻灯片'} ${index + 1}`,
                        'aria-current':
                          page.value?.part === slide.part ? 'page' : undefined,
                      },
                      [
                        h(
                          'span',
                          { class: 'ppt-slide-number' },
                          String(index + 1).padStart(2, '0')
                        ),
                        h(SlidePreview, {
                          page: slide,
                          canvasWidth: scene.value.width,
                          canvasHeight: scene.value.height,
                          width: 152,
                        }),
                        h(
                          'span',
                          { class: 'ppt-slide-caption' },
                          slide.name || `幻灯片 ${index + 1}`
                        ),
                      ]
                    )
                  )
                ),
                btn(
                  '添加幻灯片',
                  'plus',
                  async () => {
                    const result = await run({
                      type: 'slide.add',
                      after: page.value?.part,
                    })
                    if (result?.part) pagePart.value = result.part
                  },
                  !writable.value || state.value.workspace !== 'slides',
                  'ppt-add-slide'
                ),
                h('div', { class: 'ppt-sidebar-bottom' }, [
                  icon('file', 15),
                  h(
                    'span',
                    scene.value.variant === 'strict'
                      ? 'OOXML Strict'
                      : 'OOXML Transitional'
                  ),
                ]),
              ]
            ),
            h(
              'main',
              {
                class: 'ppt-canvas-area',
                ref: container,
                tabindex: 0,
                'aria-label': '幻灯片画布，可双指缩放和平移',
                onPointerdownCapture: canvasPointerDown,
                onPointermoveCapture: canvasPointerMove,
                onPointerupCapture: canvasPointerEnd,
                onPointercancelCapture: canvasPointerEnd,
                onClick: () => {
                  panel.value = false
                },
              },
              [
                h('div', { class: 'ppt-canvas-label' }, [
                  h(
                    'span',
                    state.value.workspace === 'master'
                      ? 'MASTER WORKSPACE'
                      : 'PRESENTATION'
                  ),
                  h('span', page.value?.name || '自由画布'),
                ]),
                h(
                  'div',
                  {
                    class: 'ppt-stage-boundary',
                    style: {
                      width: `${scene.value.width * scale.value}px`,
                      height: `${scene.value.height * scale.value}px`,
                      transform: `translate(calc(-50% + ${pan.value.x}px), calc(-50% + ${pan.value.y}px))`,
                    },
                  },
                  [
                    page.value
                      ? h(
                          'div',
                          {
                            class: 'ppt-slide ppt-editing-slide',
                            style: {
                              width: `${scene.value.width}px`,
                              height: `${scene.value.height}px`,
                              background: page.value.background,
                              transform: `scale(${scale.value})`,
                            },
                            onPointerdown: (event: PointerEvent) => {
                              if (event.target === event.currentTarget) {
                                selected.value = ''
                                void commitText()
                              }
                            },
                          },
                          [
                            paintLayer(
                              page.value.backgroundPaint,
                              scene.value.width,
                              scene.value.height
                            ),
                            ...page.value.objects.map((o) => {
                              const active =
                                  selected.value === o.id && !o.inherited,
                                display =
                                  draftFrame.value?.id === o.id
                                    ? { ...o, ...draftFrame.value }
                                    : o
                              return h(
                                'div',
                                {
                                  key: `${o.part}-${o.id}`,
                                  class: [
                                    'ppt-object',
                                    {
                                      'is-selected': active,
                                      'is-inherited': o.inherited,
                                      'is-editable':
                                        writable.value && !o.inherited,
                                    },
                                  ],
                                  style: objectPosition(display),
                                  onPointerdown: (event: PointerEvent) =>
                                    pointerDown(event, o),
                                  onPointermove: pointerMove,
                                  onPointerup: pointerUp,
                                  onPointercancel: pointerCancel,
                                  onDblclick: (event: MouseEvent) =>
                                    void editCanvas(event, o),
                                },
                                [
                                  h(SceneObjectView, {
                                    object: o,
                                    editor:
                                      editingId.value === o.id
                                        ? {
                                            kind: 'text',
                                            content: h('textarea', {
                                              ref: textInput,
                                              class: 'ppt-text-editor',
                                              readOnly: !writable.value,
                                              value: editText.value,
                                              onInput: (event: Event) =>
                                                (editText.value = (
                                                  event.target as HTMLTextAreaElement
                                                ).value),
                                              onBlur: commitText,
                                              onCompositionstart: () =>
                                                (composing = true),
                                              onCompositionend: () =>
                                                (composing = false),
                                              onPointerdown: (
                                                e: PointerEvent
                                              ) => e.stopPropagation(),
                                              onDblclick: (e: Event) =>
                                                e.stopPropagation(),
                                              onKeydown: (e: KeyboardEvent) => {
                                                e.stopPropagation()
                                                if (e.isComposing || composing)
                                                  return
                                                if (e.key === 'Escape') {
                                                  editingId.value = ''
                                                  textSession = undefined
                                                } else if (
                                                  e.key === 'Enter' &&
                                                  (e.ctrlKey || e.metaKey)
                                                ) {
                                                  e.preventDefault()
                                                  void commitText()
                                                }
                                              },
                                              'aria-label': '编辑文字',
                                            }),
                                          }
                                        : canvasEditor(o),
                                  }),
                                  o.kind === 'media' &&
                                  writable.value &&
                                  !presenting.value
                                    ? h(
                                        'button',
                                        {
                                          type: 'button',
                                          class: 'ppt-media-select',
                                          'aria-label': `选择媒体 ${o.name}`,
                                          onPointerdown: (
                                            event: PointerEvent
                                          ) => event.stopPropagation(),
                                          onClick: () => {
                                            selected.value = o.id
                                            replaceResource(o)
                                          },
                                        },
                                        '替换媒体'
                                      )
                                    : null,
                                  active &&
                                  writable.value &&
                                  !editingId.value &&
                                  inlineEdit.value?.object.id !== o.id
                                    ? h(
                                        'div',
                                        {
                                          class: 'ppt-selection-outline',
                                          style: {
                                            '--selection-width': `${1 / scale.value}px`,
                                          },
                                        },
                                        [
                                          h(
                                            'span',
                                            {
                                              class: 'ppt-selection-label',
                                              style: {
                                                transform: `scale(${1 / scale.value})`,
                                                transformOrigin: 'bottom left',
                                              },
                                            },
                                            o.name || o.kind
                                          ),
                                          h('button', {
                                            class: 'ppt-resize-handle',
                                            style: {
                                              transform: `scale(${1 / scale.value})`,
                                            },
                                            'aria-label': '调整对象尺寸',
                                            onPointerdown: (e: PointerEvent) =>
                                              pointerDown(e, o, true),
                                            onPointermove: pointerMove,
                                            onPointerup: pointerUp,
                                            onPointercancel: pointerCancel,
                                          }),
                                        ]
                                      )
                                    : null,
                                ]
                              )
                            }),
                          ]
                        )
                      : null,
                  ]
                ),
                h(
                  'div',
                  { class: 'ppt-canvas-hint' },
                  state.value.workspace === 'master'
                    ? '母版对象会继承到关联页面'
                    : writable.value
                      ? mobile.value
                        ? '双击文字或单元格编辑 · 双指缩放与移动'
                        : '双击文字、单元格或图片编辑 · 空格拖动平移'
                      : '只读预览'
                ),
                inlineError.value
                  ? h('div', { class: 'ppt-inline-error', role: 'alert' }, [
                      inlineError.value,
                      btn('返回草稿', 'text', () => inlineInput.value?.focus()),
                      btn('取消编辑', 'close', () => {
                        inlineEdit.value = undefined
                        inlineError.value = ''
                      }),
                    ])
                  : null,
                presenting.value
                  ? h(
                      'nav',
                      {
                        class: 'ppt-presentation-controls',
                        'aria-label': '预览翻页',
                      },
                      [
                        btn(
                          '上一页',
                          'chevron-left',
                          () => stepPresentation(-1),
                          pages.value[0]?.part === page.value?.part
                        ),
                        h(
                          'span',
                          { 'aria-live': 'polite' },
                          `${pages.value.findIndex((p) => p.part === page.value?.part) + 1} / ${pages.value.length}`
                        ),
                        btn(
                          '下一页',
                          'chevron-right',
                          () => stepPresentation(1),
                          pages.value.at(-1)?.part === page.value?.part
                        ),
                        btn('退出预览', 'close', () => {
                          presenting.value = false
                        }),
                      ]
                    )
                  : null,
              ]
            ),
            inspector(),
          ]),
          h('footer', { class: 'ppt-statusbar' }, [
            h('div', { class: 'ppt-footer-left' }, [
              btn(
                '打开',
                'upload',
                () => fileInput.value?.click(),
                !writable.value,
                'ppt-mobile-only ppt-icon-only'
              ),
              btn(
                '页面',
                'menu',
                () => (pagesOpen.value = !pagesOpen.value),
                false,
                'ppt-mobile-only'
              ),
              h(
                'span',
                `${pages.value.findIndex((p) => p.part === page.value?.part) + 1} / ${pages.value.length}`
              ),
              h(
                'span',
                { class: 'ppt-footer-muted' },
                state.value.workspace === 'master' ? '母版编辑' : '幻灯片'
              ),
              btn(
                '复制页面',
                'copy',
                copyPage,
                !writable.value,
                'ppt-icon-only'
              ),
              btn(
                '删除页面',
                'trash',
                deletePage,
                !writable.value ||
                  (state.value.workspace === 'slides' &&
                    scene.value.slides.length < 2),
                'ppt-icon-only'
              ),
            ]),
            h('div', { class: 'ppt-footer-right' }, [
              h('label', { class: 'ppt-zoom' }, [
                h('input', {
                  type: 'range',
                  min: 10,
                  max: 300,
                  value: Math.round(scale.value * 100),
                  'aria-label': '画布缩放',
                  onInput: (e: Event) =>
                    (zoom.value =
                      Number((e.target as HTMLInputElement).value) / 100),
                }),
                h(
                  'button',
                  { onClick: fitCanvas, title: '适应画布' },
                  `${Math.round(scale.value * 100)}%`
                ),
              ]),
              btn(
                '属性',
                'settings',
                () => (panel.value = !panel.value),
                false,
                'ppt-mobile-only'
              ),
            ]),
          ]),
          modal.value === 'table'
            ? h('div', { class: 'ppt-dialog-backdrop' }, [
                h(
                  'form',
                  {
                    class: 'ppt-dialog',
                    role: 'dialog',
                    'aria-modal': 'true',
                    'aria-label': '插入表格',
                    onSubmit: (event: Event) => {
                      event.preventDefault()
                      void addTable()
                    },
                  },
                  [
                    h('div', { class: 'ppt-panel-heading' }, [
                      h('h3', '插入表格'),
                      btn('关闭', 'close', () => {
                        modal.value = undefined
                      }),
                    ]),
                    h('p', '创建可在 PowerPoint 中继续编辑的标准表格。'),
                    h('div', { class: 'ppt-field-grid' }, [
                      field(
                        '行数',
                        tableRows.value,
                        (value) => {
                          tableRows.value = value
                        },
                        1,
                        100
                      ),
                      field(
                        '列数',
                        tableColumns.value,
                        (value) => {
                          tableColumns.value = value
                        },
                        1,
                        50
                      ),
                    ]),
                    h(
                      'button',
                      {
                        type: 'submit',
                        class: 'ppt-button ppt-button-primary',
                        disabled: !writable.value,
                      },
                      '插入表格'
                    ),
                  ]
                ),
              ])
            : null,
          modal.value === 'url'
            ? h(
                'div',
                {
                  class: 'ppt-dialog-backdrop',
                  onClick: (e: MouseEvent) => {
                    if (e.target === e.currentTarget) modal.value = undefined
                  },
                },
                [
                  h(
                    'form',
                    {
                      class: 'ppt-dialog',
                      onSubmit: async (e: Event) => {
                        e.preventDefault()
                        if (!url.value.trim()) return
                        modal.value = undefined
                        try {
                          await editor.open(url.value.trim())
                        } catch (error) {
                          fail(error)
                        }
                      },
                    },
                    [
                      h('div', { class: 'ppt-panel-heading' }, [
                        h('h3', '从链接打开'),
                        btn(
                          '关闭',
                          'close',
                          () => (modal.value = undefined),
                          false,
                          'ppt-icon-only'
                        ),
                      ]),
                      h(
                        'p',
                        '输入可访问的 PPTX 或 PPT 文件链接。跨域文件需服务器允许 CORS。'
                      ),
                      h('input', {
                        type: 'url',
                        required: true,
                        placeholder: 'https://example.com/presentation.pptx',
                        value: url.value,
                        onInput: (e: Event) =>
                          (url.value = (e.target as HTMLInputElement).value),
                        'aria-label': '文件链接',
                      }),
                      h(
                        'button',
                        {
                          type: 'submit',
                          class: 'ppt-button ppt-button-primary',
                        },
                        '打开演示文稿'
                      ),
                    ]
                  ),
                ]
              )
            : null,
          toast.value
            ? h('div', { class: 'ppt-toast', role: 'status' }, [
                icon('check', 16),
                toast.value,
              ])
            : null,
        ]
      )
  },
})
