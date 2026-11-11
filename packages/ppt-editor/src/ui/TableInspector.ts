import { defineComponent, h, ref, watch, type PropType } from 'vue'
import type { SceneObject } from '../types.js'

/** Keep a cell draft separate from remote snapshots until the author submits it. */
export const TableInspector = defineComponent({
  props: {
    object: { type: Object as PropType<SceneObject>, required: true },
    editable: Boolean,
    contentEditing: { type: Boolean, default: true },
    revision: Number,
    structure: {
      type: Function as PropType<
        (
          axis: 'row' | 'column',
          action: 'insert' | 'delete',
          index: number
        ) => Promise<void>
      >,
    },
    commit: {
      type: Function as PropType<
        (
          row: number,
          column: number,
          value: string,
          original: string,
          revision?: number
        ) => Promise<void>
      >,
      required: true,
    },
  },
  setup(props) {
    const row = ref(0),
      column = ref(0),
      draft = ref<string>(),
      original = ref(''),
      draftRevision = ref<number>(),
      busy = ref(false),
      structureConflict = ref(false),
      error = ref('')
    watch(
      () => `${props.object.part}:${props.object.id}`,
      () => {
        row.value = column.value = 0
        draft.value = undefined
        structureConflict.value = false
        error.value = ''
      }
    )
    const cell = () => props.object.cells?.[row.value]?.[column.value] ?? ''
    const selectCell = (r: number, c: number) => {
      const anchor = props.object.tableCells?.[r]?.[c]?.mergedInto
      row.value = anchor?.row ?? r
      column.value = anchor?.column ?? c
    }
    const clampSelection = () => {
      row.value = Math.max(
        0,
        Math.min(row.value, (props.object.cells?.length ?? 1) - 1)
      )
      column.value = Math.max(
        0,
        Math.min(
          column.value,
          (props.object.cells?.[row.value]?.length ?? 1) - 1
        )
      )
    }
    watch(
      () =>
        `${props.revision}:${props.object.cells?.map((cells) => cells.length).join(',')}`,
      () => {
        if (draft.value !== undefined) {
          structureConflict.value = true
          error.value =
            '文档版本或表格结构已改变，草稿已保留；请复制文字后还原并重新选择单元格'
        } else clampSelection()
      }
    )
    async function save() {
      if (
        draft.value === undefined ||
        !props.editable ||
        busy.value ||
        structureConflict.value
      )
        return
      busy.value = true
      error.value = ''
      try {
        await props.commit(
          row.value,
          column.value,
          draft.value,
          original.value,
          draftRevision.value
        )
        draft.value = undefined
        structureConflict.value = false
        error.value = ''
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : String(cause)
      } finally {
        busy.value = false
      }
    }
    async function changeStructure(
      axis: 'row' | 'column',
      action: 'insert' | 'delete',
      index: number
    ) {
      if (
        !props.structure ||
        !props.editable ||
        busy.value ||
        draft.value !== undefined
      )
        return
      busy.value = true
      error.value = ''
      try {
        await props.structure(axis, action, index)
        if (axis === 'row') row.value = index
        else column.value = index
        clampSelection()
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : String(cause)
      } finally {
        busy.value = false
      }
    }
    const structureControls = (
      axis: 'row' | 'column',
      index: number,
      count: number
    ) =>
      h(
        'div',
        { class: 'ppt-table-structure-row' },
        (['insert', 'insert', 'delete'] as const).map((action, position) =>
          h(
            'button',
            {
              type: 'button',
              class: 'ppt-button',
              disabled:
                !props.editable ||
                busy.value ||
                props.object.tableCells?.some((row) =>
                  row.some((cell) => cell.rowSpan > 1 || cell.columnSpan > 1)
                ) ||
                draft.value !== undefined ||
                (action === 'delete'
                  ? count <= 1
                  : count >= (axis === 'row' ? 100 : 50)),
              onClick: () =>
                changeStructure(axis, action, index + Number(position === 1)),
            },
            (axis === 'row'
              ? ['上方插行', '下方插行', '删除行']
              : ['左侧插列', '右侧插列', '删除列'])[position]
          )
        )
      )
    const selector = (
      label: string,
      current: number,
      count: number,
      change: (value: number) => number
    ) =>
      h('label', { class: 'ppt-field' }, [
        h('span', label),
        h(
          'select',
          {
            value: current,
            disabled: busy.value || draft.value !== undefined,
            onChange: (event: Event) => {
              const select = event.target as HTMLSelectElement
              select.value = String(change(Number(select.value)))
            },
          },
          Array.from({ length: count }, (_, index) =>
            h('option', { value: index }, String(index + 1))
          )
        ),
      ])
    return () =>
      h('section', { class: 'ppt-property-group ppt-table-inspector' }, [
        h('h4', props.contentEditing ? '表格内容' : '表格结构'),
        h('div', { class: 'ppt-field-grid' }, [
          selector(
            '行',
            row.value,
            props.object.cells?.length ?? 0,
            (value) => {
              selectCell(value, column.value)
              return row.value
            }
          ),
          selector(
            '列',
            column.value,
            props.object.cells?.[row.value]?.length ?? 0,
            (value) => {
              selectCell(row.value, value)
              return column.value
            }
          ),
        ]),
        props.contentEditing
          ? h('label', { class: 'ppt-field' }, [
              h('span', `单元格 ${row.value + 1} · ${column.value + 1}`),
              h('textarea', {
                value: draft.value ?? cell(),
                rows: 4,
                disabled: !props.editable || busy.value,
                'aria-label': '单元格内容',
                onInput: (event: Event) => {
                  if (draft.value === undefined) {
                    original.value = cell()
                    draftRevision.value = props.revision
                  }
                  draft.value = (event.target as HTMLTextAreaElement).value
                },
              }),
            ])
          : null,
        props.contentEditing
          ? h('div', { class: 'ppt-format-row' }, [
              h(
                'button',
                {
                  type: 'button',
                  class: 'ppt-button ppt-button-primary',
                  disabled:
                    !props.editable ||
                    busy.value ||
                    draft.value === undefined ||
                    structureConflict.value,
                  onClick: save,
                },
                busy.value ? '保存中…' : '应用单元格'
              ),
              h(
                'button',
                {
                  type: 'button',
                  class: 'ppt-button',
                  disabled: busy.value || draft.value === undefined,
                  onClick: () => {
                    draft.value = undefined
                    structureConflict.value = false
                    error.value = ''
                    clampSelection()
                  },
                },
                '还原'
              ),
            ])
          : null,
        error.value
          ? h('p', { role: 'alert', class: 'ppt-cell-error' }, error.value)
          : null,
        props.structure
          ? h('div', { class: 'ppt-table-structure' }, [
              h('h4', '行列操作'),
              structureControls(
                'row',
                row.value,
                props.object.cells?.length ?? 0
              ),
              structureControls(
                'column',
                column.value,
                props.object.cells?.[row.value]?.length ?? 0
              ),
            ])
          : null,
        h(
          'p',
          { class: 'ppt-field-note' },
          '双击画布单元格编辑文字，Ctrl / ⌘ + Enter 保存，Esc 取消。合并表格暂不支持行列调整。'
        ),
      ])
  },
})
