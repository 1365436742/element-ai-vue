<template>
  <div :class="[ns.b(), ns.e('markdown-body')]">
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElABaseWordInput',
})
import { watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import Placeholder from '@tiptap/extension-placeholder'
import { BaseWordInputEmitsType, baseWordInputProps } from './props'
import { getParseFile } from '@element-ai-vue/utils'
import { useNamespace } from '@element-ai-vue/hooks'

const ns = useNamespace('markdown')

const props = defineProps({
  ...baseWordInputProps,
})

const emits = defineEmits<BaseWordInputEmitsType>()

const editor = useEditor({
  content: '',
  editable: !props.disabled,
  extensions: [
    StarterKit,
    Markdown,
    Placeholder.configure({
      placeholder: () => props.placeholder,
      showOnlyWhenEditable: false,
    }),
    ...props.extensions,
  ],
  onCreate() {
    editor.value?.commands.setContent(props.modelValue || '')
  },
  onUpdate() {
    const markdown = editor.value?.storage.markdown.getMarkdown() || ''
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
