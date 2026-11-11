import { defineComponent, h, ref, computed, watch, type PropType } from 'vue'
import type { SceneObject } from '../types.js'
export const DiagramInspector = defineComponent({
  props: {
    object: { type: Object as PropType<SceneObject>, required: true },
    editable: Boolean,
    revision: { type: Number, required: true },
    commit: {
      type: Function as PropType<
        (nodeId: string, text: string, revision: number) => Promise<unknown>
      >,
      required: true,
    },
  },
  setup(props) {
    const selected = ref(props.object.diagramTexts?.[0]?.id ?? '')
    const current = computed(() =>
      props.object.diagramTexts?.find((node) => node.id === selected.value)
    )
    const draft = ref(current.value?.text ?? ''),
      original = ref(draft.value),
      base = ref(props.revision)
    const busy = ref(false),
      error = ref('')
    const dirty = computed(() => draft.value !== original.value)
    const reset = () => {
      draft.value = current.value?.text ?? ''
      original.value = draft.value
      base.value = props.revision
      error.value = ''
    }
    watch(
      () => props.revision,
      () => {
        if (!dirty.value) reset()
      }
    )
    watch(selected, reset)
    async function save() {
      if (!props.editable || busy.value || !dirty.value) return
      if (base.value !== props.revision) {
        error.value = '文档已变化，草稿已保留。请还原后重新编辑。'
        return
      }
      busy.value = true
      error.value = ''
      try {
        await props.commit(selected.value, draft.value, base.value)
        reset()
      } catch (e) {
        error.value = e instanceof Error ? e.message : String(e)
      } finally {
        busy.value = false
      }
    }
    return () =>
      h(
        'fieldset',
        {
          disabled: !props.editable || busy.value,
          class: 'ppt-diagram-inspector',
        },
        [
          h('legend', 'SmartArt 文字'),
          h('label', [
            '节点',
            h(
              'select',
              {
                'aria-label': 'SmartArt 节点',
                value: selected.value,
                disabled: dirty.value,
                onChange: (e: Event) => {
                  if (dirty.value) {
                    ;(e.target as HTMLSelectElement).value = selected.value
                    return
                  }
                  selected.value = (e.target as HTMLSelectElement).value
                },
              },
              props.object.diagramTexts?.map((node, index) =>
                h(
                  'option',
                  { value: node.id },
                  `${index + 1}. ${node.text || '空节点'}`
                )
              )
            ),
          ]),
          h('label', [
            '节点内容',
            h('textarea', {
              'aria-label': 'SmartArt 节点内容',
              rows: 4,
              value: draft.value,
              onInput: (e: Event) => {
                draft.value = (e.target as HTMLTextAreaElement).value
              },
            }),
          ]),
          h('div', { class: 'ppt-field-grid' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'ppt-button',
                disabled: !dirty.value,
                onClick: save,
              },
              '应用节点文字'
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'ppt-button',
                disabled: !dirty.value,
                onClick: reset,
              },
              '还原节点文字'
            ),
          ]),
          error.value ? h('p', { role: 'alert' }, error.value) : null,
          h(
            'p',
            { class: 'ppt-help' },
            '支持节点文字与图示位置、尺寸编辑。结构增删和重新布局尚未实现。'
          ),
        ]
      )
  },
})
