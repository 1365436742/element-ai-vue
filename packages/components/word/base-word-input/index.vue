<template>
  <div
    :class="[
      ns.b(),
      ns.e('markdown-body'),
      theme === 'dark' ? ns.m('dark') : '',
    ]"
  >
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElABaseWordInput',
})
import { computed, PropType, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import {
  createParsHtmlProcessor,
  defaultCustomPlugins,
  getParseFile,
  KatexBlock,
  KatexInline,
  processBaseMarkdown,
} from '@element-ai-vue/utils'
import { useNamespace } from '@element-ai-vue/hooks'
import { mergeWith } from 'lodash-es'
import { BaseWordInputEmitsType, baseWordInputProps } from './props'

const ns = useNamespace('markdown')
const baseNs = useNamespace('word')

const props = defineProps({
  theme: {
    type: String as PropType<'light' | 'dark'>,
    default: '',
  },
  ...baseWordInputProps,
})

const emits = defineEmits<BaseWordInputEmitsType>()

const processor = computed(() => {
  const plugins = mergeWith([], defaultCustomPlugins, props.remarkPlugins)
  return createParsHtmlProcessor(plugins)
})

const setMarkdownContent = async (content: string) => {
  if (!editor.value || !processor.value) return
  const html = await processBaseMarkdown(processor.value, content)
  editor.value.commands.setContent(html)
}

const editor = useEditor({
  content: '',
  editable: !props.disabled,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: () => props.placeholder,
      showOnlyWhenEditable: false,
    }),
    Table.configure({
      resizable: false,
      HTMLAttributes: {
        class: 'tiptap-table',
      },
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    KatexBlock,
    KatexInline,
    ...props.extensions,
  ],
  editorProps: {
    attributes: {
      class: baseNs.e('editor'),
    },
  },
  onCreate() {
    emits('create')
    // editor.value?.commands.setContent(props.modelValue || '')
  },
  onUpdate() {
    // const markdown = editor.value?.storage.markdown.getMarkdown() || ''
  },
  onPaste: (e) => {
    emits('paste', e)
    const files = getParseFile(e)
    if (files?.length) {
      emits('pasteFile', files)
    }
  },
  onBlur: () => emits('blur'),
  onFocus: () => emits('focus'),
})

watch(
  () => props.disabled,
  () => {
    editor.value?.setEditable(!props.disabled)
  }
)

watch(
  () => props.placeholder,
  () => {
    editor.value?.view.dispatch(editor.value.state.tr)
  }
)

defineExpose({
  editor,
  setMarkdownContent,
})
</script>
