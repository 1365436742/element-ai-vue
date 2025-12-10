<template>
  <template v-for="(part, index) in parts" :key="index">
    <slot
      v-if="part.type === 'code'"
      :name="part.language"
      :content="part.content"
      :language="part.language"
    >
      <CodeHighlight
        :content="part.content"
        :language="part.language"
      ></CodeHighlight>
    </slot>
    <div class="markdown-body" v-else v-html="part.content"></div>
  </template>
</template>

<script setup lang="ts">
import {
  processMarkdownToParts,
  MarkdownPart,
  MiddlewarePluginItem,
  defaultCustomPlugins,
  createBaseProcessor,
} from '@element-ai/utils'
import { mergeWith } from 'lodash-es'
import { watch, ref, computed } from 'vue'
import CodeHighlight from '../code-highlight/index.vue'

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  remarkPlugins: {
    type: Array as () => MiddlewarePluginItem[],
    default: () => [],
  },
})
const parts = ref<MarkdownPart[]>([])

const processor = computed(() => {
  const plugins = mergeWith([], defaultCustomPlugins, props.remarkPlugins)
  return createBaseProcessor(plugins)
})

watch(
  [() => props.content, () => processor.value],
  async () => {
    if (!props.content) {
      parts.value = []
      return
    }
    parts.value = await processMarkdownToParts(props.content, processor.value)
  },
  { immediate: true }
)
</script>

<style scoped></style>
