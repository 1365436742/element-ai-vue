<template>
  <div
    :class="[
      ns.b(),
      nsMd.b(),
      nsMd.e('markdown-body'),
      theme === 'dark' ? nsMd.m('dark') : '',
    ]"
    :style="{
      'min-height': placeholderHeight,
      opacity,
    }"
  >
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { MDocEditorEmitsType, mDocEditorProps } from './props'
import { computed, ref, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { debounce, mergeWith } from 'lodash-es'

import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Image } from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyleKit } from '@tiptap/extension-text-style'
import { KatexInline, KatexBlock } from './katex-slot'
import {
  createBaseProcessor,
  defaultCustomPlugins,
  getParseFile,
  getPlaceholderHeight,
  katexProcess,
  processMarkdownToHtml,
} from '@element-ai-vue/utils'

defineOptions({
  name: 'ElAMDocEditor',
})

const props = defineProps({
  ...mDocEditorProps,
})

const placeholderHeight = ref('')
const opacity = ref(0)
const ns = useNamespace('m-doc-editor')
const nsMd = useNamespace('markdown')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)

const emits = defineEmits<MDocEditorEmitsType>()

const editor = useEditor({
  content: '',
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      link: {
        openOnClick: false, // 编辑模式下点击不跳转，而是允许编辑
        autolink: true, // 自动识别输入的 URL
        linkOnPaste: true, // 粘贴 URL 时自动创建链接
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      },
    }),
    KatexInline,
    KatexBlock,
    Image.configure({
      inline: true,
    }),
    Placeholder.configure({
      placeholder: () => props.placeholder,
      showOnlyWhenEditable: false,
    }),
    Highlight.configure({ multicolor: true }),
    TextStyleKit.configure({ textStyle: { mergeNestedSpanStyles: true } }),
    TableKit,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ...props.extensions,
  ],
  editorProps: {
    attributes: {
      class: ns.e('editor'),
    },
  },
  onUpdate: () => {
    emits('update:modelValue', editor.value?.getHTML() || '')
  },
  onCreate() {
    if (editor.value?.isEmpty) {
      placeholderHeight.value = getPlaceholderHeight(editor.value)
    }
    setHtmlContent(props.modelValue || '')
    opacity.value = 1
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

const processor = computed(() => {
  const plugins = mergeWith([], defaultCustomPlugins, props.remarkPlugins)
  return createBaseProcessor(plugins)
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

const setHtmlContent = debounce(
  async (content: string) => {
    const html = await processMarkdownToHtml(
      katexProcess(content),
      processor.value
    )
    editor.value?.commands.setContent(html)
  },
  20,
  {
    trailing: true,
    leading: true,
  }
)

watch(
  () => props.modelValue,
  async (newContent) => {
    const isSame = editor.value?.getHTML() === newContent
    if (isSame) return
    setHtmlContent(newContent || '')
  }
)

defineExpose({
  editor,
  focus: () => editor.value?.commands?.focus(),
  blur: () => editor.value?.commands?.blur(),
})
</script>
