import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import {
  ensureTrailingText,
  getCustomSlotAttribute,
  keyDownHandlePlugin,
} from '@element-ai-vue/utils'
import Component from './index.vue'

export const REACT_COMPONENT_NODE_NAME = 'inputSlot'

const InputSlot = Node.create({
  name: 'inputSlot',
  group: 'inline',
  inline: true,
  content: 'inline*',
  atom: false,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [
      {
        tag: 'input-slot',
        getAttrs: (element) => ({
          placeholder: element.getAttribute('placeholder'),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['input-slot', mergeAttributes(HTMLAttributes), 0]
  },

  addAttributes() {
    return {
      placeholder: {
        default: '',
        parseHTML: (element) => element.getAttribute('placeholder') || '',
        renderHTML: (attributes) => ({
          placeholder: attributes.placeholder,
        }),
      },
      isCustomSlot: getCustomSlotAttribute(),
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(Component)
  },

  addProseMirrorPlugins() {
    return [ensureTrailingText(), keyDownHandlePlugin()]
  },
})

export default InputSlot
