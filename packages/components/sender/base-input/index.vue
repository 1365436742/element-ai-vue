<template>
  <div
    :class="ns.b()"
    :style="{
      'min-height': placeholderHeight,
      opacity,
    }"
  >
    <slot name="input-tag-prefix">
      <InputTagPrefix
        v-if="showInputTagPrefix && inputTagPrefixValue"
        :value="inputTagPrefixValue"
        @remove="closeInputTagPrefix"
      ></InputTagPrefix>
    </slot>
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElABaseInput',
})
import { watch, ref } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import HardBreak from '@tiptap/extension-hard-break'
import History from '@tiptap/extension-history'
import Placeholder from '@tiptap/extension-placeholder'
import type { EditorView } from 'prosemirror-view'
import { handlePasteLogic, getParseFile } from '@element-ai-vue/utils'
import { useNamespace } from '@element-ai-vue/hooks'
import InputTagPrefix from './input-tag-prefix.vue'
import InputSlot from '../input-slot/index'
import SelectSlot from '../select-slot/index'
import { BaseInputEmitsType, baseInputProps } from './props'

const ns = useNamespace('base-sender-input')

const props = defineProps({
  ...baseInputProps,
})

const emits = defineEmits<BaseInputEmitsType>()

const placeholderHeight = ref('')
const opacity = ref(0)

const handleKeyDown = (view: EditorView, event: KeyboardEvent) => {
  // 如果是退格键，判断内容是否为空
  if (event.key === 'Backspace') {
    // 如果内容为空或仅包含空白字符，阻止删除操作
    if (editor.value?.isEmpty && props.inputTagPrefixValue) {
      emits('update:showInputTagPrefix', false)
    }
  }
  if (props.onHandleKeyDown) {
    return props.onHandleKeyDown(view, event)
  }
  if (event.key === 'Enter' && !props.enterBreak) {
    if (event.shiftKey) {
      return false
    }
    emits('enterPressed')
    event.preventDefault()
    return true
  }
  return false
}

const editor = useEditor({
  content: '',
  editable: !props.disabled,
  extensions: [
    Document,
    Paragraph,
    Text,
    HardBreak,
    History,
    InputSlot,
    SelectSlot,
    Placeholder.configure({
      placeholder: () => props.placeholder,
      showOnlyWhenEditable: false,
    }),
    ...props.extensions,
  ],
  editorProps: {
    handleKeyDown,
    handlePaste: handlePasteLogic,
    attributes: {
      class: ns.e('editor'),
    },
  },
  onUpdate: () => {
    emits('update:modelValue', editor.value?.getHTML() || '')
  },
  onCreate() {
    if (editor.value?.isEmpty) {
      placeholderHeight.value = getPlaceholderHeight()
    }
    editor.value?.commands.setContent(props.modelValue || '')
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

const getPlaceholderHeight = () => {
  const placeholder = editor.value?.view.dom.querySelector(
    '[data-placeholder]'
  ) as HTMLElement
  if (placeholder) {
    const style = window.getComputedStyle(placeholder, '::before')
    return style.height || '0px'
  }
  return ''
}

const closeInputTagPrefix = () => {
  emits('update:showInputTagPrefix', false)
}

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
    const isSame = editor.value?.getHTML() === newContent
    if (isSame) return
    editor.value?.commands.setContent(newContent)
  }
)

defineExpose({
  editor,
})
</script>
