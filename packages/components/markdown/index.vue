<template>
  <template v-for="(part, index) in parts" :key="index">
    <slot
      v-if="part.type === 'code' && part.language === 'echarts'"
      name="echarts"
      :content="part.content"
      :language="part.language"
    >
      <CodeHighlight
        :content="part.content"
        :language="part.language"
      ></CodeHighlight>
    </slot>
    <slot
      v-else-if="part.type === 'code' && part.language === 'mermaid'"
      name="mermaid"
      :content="part.content"
      :language="part.language"
    >
      <CodeMermaid
        :content="part.content"
        v-bind="codeMermaidProps"
      ></CodeMermaid>
    </slot>
    <slot
      v-else-if="part.type === 'code'"
      name="code"
      :content="part.content"
      :language="part.language"
    >
      <CodeHighlight
        :content="part.content"
        :language="part.language"
        v-bind="codeHighlightProps"
      ></CodeHighlight>
    </slot>
    <div class="markdown-body" v-else v-html="part.content"></div>
  </template>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElAMarkdown',
})
import {
  processMarkdownToParts,
  MarkdownPart,
  MiddlewarePluginItem,
  defaultCustomPlugins,
  createBaseProcessor,
} from '@element-ai-vue/utils'
import { mergeWith } from 'lodash-es'
import { watch, ref, computed, PropType } from 'vue'
import CodeHighlight from '../code-highlight/index.vue'
import CodeMermaid from '../code-mermaid/index.vue'
import { CodeHighlightPropsType } from '../code-highlight/props'
import { CodeMermaidPropsType } from '../code-mermaid/props'

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  remarkPlugins: {
    type: Array as PropType<MiddlewarePluginItem[]>,
    default: () => [],
  },
  codeHighlightProps: {
    type: Object as CodeHighlightPropsType,
    default: () => ({}),
  },
  codeMermaidProps: {
    type: Object as CodeMermaidPropsType,
    default: () => ({}),
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
