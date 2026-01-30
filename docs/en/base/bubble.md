# Bubble

Bubble component for displaying conversation messages, supporting multiple style variants and interactive effects. The Bubble component is one of the core components for building conversational AI interaction interfaces. It simulates the message bubble style commonly seen in chat applications, supporting text, Markdown rendering, and typewriter animation effects for a more natural and smooth AI conversation experience.

## Basic Usage

:::demo BubbleBase

```vue
<!-- @include: ../../examples/bubble/base.vue -->
```

:::

## Variants and Shapes

:::demo BubbleVariantSharp

```vue
<!-- @include: ../../examples/bubble/variant-sharp.vue -->
```

:::

## Markdown

:::demo BubbleMarkdown

```vue
<template>
  <div class="base-box">
    <!-- Using vueuse to define template -->
    <DefineTemplate
      v-slot="{ content, placement, loading, isMarkdown, typing, variant }"
    >
      <ElABubble :content :placement :loading :typing :is-markdown :variant>
        <template #header v-if="!placement">
          <ElAThinking title="Today's Topic: AI Era">
            <div class="think">
              Hello, I am Element AI Vue, an AI component library built with
              Vue3 and TypeScript, dedicated to providing developers with
              convenient and efficient AI solutions.
            </div>
          </ElAThinking>
        </template>
        <template #footer>
          <div class="actions" :class="placement">
            <span class="element-ai-vue-iconfont icon-copy"></span>
            <span class="element-ai-vue-iconfont icon-regen"></span>
          </div>
        </template>
      </ElABubble>
    </DefineTemplate>
    <div class="btns">
      <button class="switch-btn" @click="start">Chat</button>
    </div>
    <ReuseTemplate v-for="(item, index) in list" :key="index" v-bind="item" />
  </div>
</template>

<script setup lang="ts">
import { ElABubble, ElAThinking } from 'element-ai-vue'
import { createReusableTemplate } from '@vueuse/core'
import { ref } from 'vue'

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

const list = ref<any[]>([
  {
    content: 'Hello, I am element-ai-vue',
    placement: 'end',
    isMarkdown: false,
    loading: false,
    typing: false,
  },
])

const mdContent = `
| Name | Age | Occupation |
| ---- | ---- | ---- |
| John | 25   | Engineer |
| Jane | 30   | Designer |

# JavaScript Code Block
\`\`\`javascript
console.log(123); 
\`\`\`

# Mermaid Code Block
\`\`\`mermaid
flowchart TD
    A[User visits registration page] --> B{Enter registration info}
    B -->|Info complete| C[Backend validates info]
    B -->|Info missing| D[Prompt user to fill required fields]
\`\`\`
`

const start = () => {
  const role = list.value.length % 2 === 0 ? 'user' : 'assistant'
  list.value.push({
    content: role === 'user' ? 'Hello, I am element-ai-vue' : mdContent,
    placement: role === 'user' ? 'end' : 'start',
    isMarkdown: role === 'assistant',
    loading: role === 'assistant',
    typing: role === 'assistant',
    variant: role === 'assistant' ? 'borderless' : 'default',
  })
  const loadingChangeIndex = list.value.length - 1
  setTimeout(() => {
    list.value[loadingChangeIndex].loading = false
  }, 500)
}
</script>

<style scoped lang="scss">
.think {
  padding: 0 12px 10px;
  color: rgba(17, 25, 37, 0.45);
  font-size: 14px;
}
.actions {
  display: flex;
  gap: 8px;
  font-size: 16px;
  &.end {
    justify-content: flex-end;
  }
  & > span {
    cursor: pointer;
    padding: 0 5px;
  }
}
.base-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
```

:::

## Props

| Property   | Description                                                         | Type                                                 | Default     |
| ---------- | ------------------------------------------------------------------- | ---------------------------------------------------- | ----------- |
| placement  | Bubble position                                                     | `'start' \| 'end'`                                   | `'start'`   |
| content    | Bubble content                                                      | `string`                                             | `''`        |
| typing     | Whether to enable typewriter effect                                 | `boolean`                                            | `false`     |
| typingOver | Content output completion flag, typewriter auto-completes when true | `boolean`                                            | `true`      |
| loading    | Whether to show loading state                                       | `boolean`                                            | `false`     |
| isMarkdown | Whether to render Markdown content                                  | `boolean`                                            | `false`     |
| variant    | Bubble variant style                                                | `'filled' \| 'outlined' \| 'shadow' \| 'borderless'` | `'filled'`  |
| shape      | Bubble shape                                                        | `'default' \| 'round' \| 'corner'`                   | `'default'` |

## Slots

| Slot Name | Description                                                                             | Scope Parameters |
| --------- | --------------------------------------------------------------------------------------- | ---------------- |
| default   | Custom bubble content, overrides content prop. With typewriter, content gradually fills | content: string  |
| avatar    | Custom avatar area                                                                      | -                |
| header    | Custom header area                                                                      | -                |
| footer    | Custom footer area                                                                      | -                |

## Exposes

| Method Name     | Description                            | Type         |
| --------------- | -------------------------------------- | ------------ |
| overTyperwriter | Immediately complete typewriter effect | `() => void` |
