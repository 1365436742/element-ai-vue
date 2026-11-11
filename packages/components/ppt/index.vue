<template>
  <PptEditor
    ref="editor"
    v-bind="$attrs"
    :source="source"
    :editable="editable"
    :options="options"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PptEditor } from 'element-ai-vue-ppt'
import type {
  Command,
  GenerationEvent,
  PptEditorOptions,
  PptSource,
  PptEditorHandle,
} from 'element-ai-vue-ppt'

defineOptions({
  name: 'ElAPpt',
  inheritAttrs: false,
})
withDefaults(
  defineProps<{
    source?: PptSource
    editable?: boolean
    options?: PptEditorOptions
  }>(),
  { editable: true }
)
const editor = ref<PptEditorHandle>()
defineExpose({
  open: (source: PptSource) => editor.value?.open(source),
  getState: () => editor.value?.getState(),
  execute: (command: Command) => editor.value?.execute(command),
  exportFile: (options?: { format?: 'pptx' | 'ppt' }) =>
    editor.value?.exportFile(options),
  applyGenerationEvent: (event: GenerationEvent) =>
    editor.value?.applyGenerationEvent(event),
  cancelGeneration: () => editor.value?.cancelGeneration(),
  resolveDraft: (action: 'accept' | 'discard') =>
    editor.value?.resolveDraft(action),
  undo: () => editor.value?.undo(),
  redo: () => editor.value?.redo(),
  setWorkspace: (workspace: 'slides' | 'master') =>
    editor.value?.setWorkspace(workspace),
})
</script>
