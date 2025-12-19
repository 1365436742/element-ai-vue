import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import SelectSlotComponent from './index.vue'
import { strings } from '@element-ai-vue/constants'
import { getCustomSlotAttribute } from '@element-ai-vue/utils'

const SelectSlot = Node.create({
  name: 'selectSlot',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      value: {
        default: strings.ZERO_WIDTH_CHAR,
        parseHTML: (element: HTMLElement) => element.getAttribute('value'),
        renderHTML: (attrs: Record<string, any>) => ({ value: attrs.value }),
      },
      options: {
        default: '',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('options') || '',
        renderHTML: (attrs: Record<string, any>) =>
          attrs.options ? { options: attrs.options } : {},
      },
      isCustomSlot: getCustomSlotAttribute(),
    }
  },

  parseHTML() {
    return [
      {
        tag: 'select-slot',
      },
    ]
  },
  renderText({ node }) {
    const options = JSON.parse(node.attrs.options || '[]')
    const label =
      options?.find(
        (item: { value: string }) => item.value === node.attrs.value
      )?.label || options?.[0]?.label
    return label || node.textContent
  },
  renderHTML({ HTMLAttributes }) {
    return ['select-slot', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return VueNodeViewRenderer(SelectSlotComponent)
  },
})

export default SelectSlot
