<template>
  <div :class="[ns.b(), ns.e('markdown-body')]">
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElABaseWordInput',
})
import { computed, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import DOMPurify from 'dompurify'
import { BaseWordInputEmitsType, baseWordInputProps } from './props'
import {
  createParsHtmlProcessor,
  defaultCustomPlugins,
  getParseFile,
  katexProcess,
} from '@element-ai-vue/utils'
import { useNamespace } from '@element-ai-vue/hooks'
import { mergeWith } from 'lodash-es'
import { KatexBlock, KatexInline } from './extensions'

const ns = useNamespace('markdown')
const baseNs = useNamespace('word')

const props = defineProps({
  ...baseWordInputProps,
})

const emits = defineEmits<BaseWordInputEmitsType>()

const processor = computed(() => {
  const plugins = mergeWith([], defaultCustomPlugins, props.remarkPlugins)
  return createParsHtmlProcessor(plugins)
})

const processBaseMarkdown = async (content: string) => {
  try {
    // 预处理：转换 LaTeX 格式
    const processedContent = katexProcess(content)
    const result = await processor.value.process(processedContent)
    // 配置 DOMPurify 以保留 KaTeX 所需的属性和元素
    return DOMPurify.sanitize(result.toString(), {
      ADD_ATTR: ['target'],
    })
  } catch (error: any) {
    return `<div class="error">处理错误: ${error.message}</div>`
  }
}

const editor = useEditor({
  content: '',
  editable: !props.disabled,
  extensions: [
    StarterKit,
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
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
  [() => props.modelValue, () => processor.value, () => editor.value],
  async () => {
    if (props.modelValue !== undefined && editor.value) {
      const html = await processBaseMarkdown(props.modelValue)
      editor.value?.commands.setContent(html)
    }
  }
)

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

watch(
  () => props.modelValue,
  (newContent) => {
    // const isSame = editor.value?.getHTML() === newContent
    // // editor.value?.storage.markdown.
    // if (isSame) return
    // editor.value?.commands.setContent(newContent)
  }
)

defineExpose({
  editor,
})
</script>
