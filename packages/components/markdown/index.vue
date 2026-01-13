<template>
  <div :class="[ns.b(), theme === 'dark' ? ns.m('dark') : '']">
    <template v-for="(part, index) in parts" :key="index">
      <slot
        v-if="part.type === 'code' && part.language === 'mermaid'"
        name="mermaid"
        :content="part.content"
        :language="part.language"
        :theme="CodeMermaidThemeMap[theme || 'light']"
        v-bind="codeMermaidProps"
      >
        <CodeMermaid :content="part.content" :theme v-bind="codeMermaidProps">
          <template #toolbar="props">
            <slot name="code-mermaid-toolbar" v-bind="props"></slot>
          </template>
          <template #fullscreen-toolbar="props">
            <slot name="code-mermaid-fullscreen-toolbar" v-bind="props"></slot>
          </template>
        </CodeMermaid>
      </slot>
      <slot
        v-else-if="part.type === 'code'"
        name="code"
        :content="part.content"
        :language="part.language"
        :theme
        v-bind="codeHighlightProps"
      >
        <CodeHighlight
          :content="part.content"
          :language="part.language"
          :theme
          v-bind="codeHighlightProps"
        >
          <template #header="props">
            <slot name="code-highlight-header" v-bind="props"></slot>
          </template>
        </CodeHighlight>
      </slot>
      <VNodeRenderer
        v-else
        :class="[ns.e('markdown-body'), 'markdown-body']"
        :content="part.content"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElAMarkdown',
})
import {
  processMarkdownToParts,
  MarkdownPart,
  defaultCustomPlugins,
  createBaseProcessor,
  katexProcess,
} from '@element-ai-vue/utils'
import { CodeMermaidThemeMap } from '@element-ai-vue/constants'
import { mergeWith } from 'lodash-es'
import { watch, ref, computed } from 'vue'
import CodeHighlight from '../code-highlight/index.vue'
import CodeMermaid from '../code-mermaid/index.vue'
import { markdownProps } from './props'
import { useNamespace, useTheme } from '@element-ai-vue/hooks'

const ns = useNamespace('markdown')
const props = defineProps({
  ...markdownProps,
})

const VNodeRenderer = (vnodeParams: { content: any }) => {
  return vnodeParams.content
}

const parts = ref<MarkdownPart[]>([])
const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
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

    parts.value = await processMarkdownToParts(
      katexProcess(props.content),
      processor.value
    )
  },
  { immediate: true }
)
</script>

<style scoped></style>
