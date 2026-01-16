import { MiddlewarePluginItem } from '@element-ai-vue/utils'
import { Extensions } from '@tiptap/vue-3'
import { ExtractPropTypes, PropType } from 'vue'
// import type { EditorView } from 'prosemirror-view'

export const baseWordInputProps = {
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  extensions: {
    type: Array as PropType<Extensions>,
    default: () => [],
  },
  remarkPlugins: {
    type: Array as PropType<MiddlewarePluginItem[]>,
    default: () => [],
  },
}

export type BaseWordInputEmitsType = {
  (e: 'update:modelValue', value: string): void
  (e: 'paste', event: ClipboardEvent): void
  (e: 'pasteFile', files: File[]): void
  (e: 'blur'): void
  (e: 'focus'): void
}

export type BaseWordInputPropsType = PropType<
  Partial<ExtractPropTypes<typeof baseWordInputProps>>
>
