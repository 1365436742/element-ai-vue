import { ExtractPropTypes, PropType } from 'vue'
import { MiddlewarePluginItem } from '@element-ai-vue/utils'
import { Extensions } from '@tiptap/vue-3'

export const mDocEditorProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    default: '',
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

export type MDocEditorEmitsType = {
  (e: 'update:modelValue', value: string): void
  (e: 'enterPressed'): void
  (e: 'paste', event: ClipboardEvent): void
  (e: 'pasteFile', files: File[]): void
  (e: 'blur'): void
  (e: 'focus'): void
}

export type MDocEditorPropsType = PropType<
  Partial<ExtractPropTypes<typeof mDocEditorProps>>
>
