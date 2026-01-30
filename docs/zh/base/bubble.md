# Bubble 对话气泡

Bubble 对话气泡组件，用于展示对话消息内容，支持多种样式变体和交互效果。Bubble 组件是构建对话式 AI 交互界面的核心组件之一。它模拟了常见聊天应用中的消息气泡样式，支持文本、Markdown 渲染以及打字机动画效果，让 AI 对话体验更加自然流畅。

## 基础用法

:::demo BubbleBase

```vue
<!-- @include: ../../examples/bubble/base.vue -->
```

:::

## 变体于形状

:::demo BubbleVariantSharp

```vue
<!-- @include: ../../examples/bubble/variant-sharp.vue -->
```

:::

## markdown

:::demo BubbleMarkdown

```vue
<template>
  <div class="base-box">
    <!-- 借助 vueuse定义模版 -->
    <DefineTemplate
      v-slot="{ content, placement, loading, isMarkdown, typing, variant }"
    >
      <ElABubble :content :placement :loading :typing :is-markdown :variant>
        <template #header v-if="!placement">
          <ElAThinking title="今日话题 AI时代">
            <div class="think">
              你好，我是Element AI
              Vue，一个基于Vue3和TypeScript构建的AI组件库，致力于为开发者提供便捷、高效的AI解决方案。
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
      <button class="switch-btn" @click="start">对话</button>
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
    content: '你好我是element-ai-vue',
    placement: 'end',
    isMarkdown: false,
    loading: false,
    typing: false,
  },
])

const mdContent = `
| 姓名 | 年龄 | 职业 |
| ---- | ---- | ---- |
| 张三 | 25   | 工程师 |
| 李四 | 30   | 设计师 |

# js代码块
\`\`\`javascript
console.log(123); 
\`\`\`

# js代码块
\`\`\`mermaid
flowchart TD
    A[用户访问注册页面] --> B{输入注册信息}
    B -->|信息完整| C[后端验证信息合法性]
    B -->|信息缺失| D[提示用户补充必填项]
\`\`\`
`

const start = () => {
  const role = list.value.length % 2 === 0 ? 'user' : 'assistant'
  list.value.push({
    content: role === 'user' ? '你好我是element-ai-vue' : mdContent,
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

## props

| 属性名     | 说明                                                   | 类型                                                 | 默认值      |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------- | ----------- |
| placement  | 气泡位置                                               | `'start' \| 'end'`                                   | `'start'`   |
| content    | 气泡内容                                               | `string`                                             | `''`        |
| typing     | 是否启用打字机效果                                     | `boolean`                                            | `false`     |
| typingOver | content 内容输出完成标识，置为 true 时打字机会自动完成 | `boolean`                                            | `true`      |
| loading    | 是否显示加载状态                                       | `boolean`                                            | `false`     |
| isMarkdown | 是否渲染 Markdown 内容                                 | `boolean`                                            | `false`     |
| variant    | 气泡变体样式                                           | `'filled' \| 'outlined' \| 'shadow' \| 'borderless'` | `'filled'`  |
| shape      | 气泡形状                                               | `'default' \| 'round' \| 'corner'`                   | `'default'` |

## slots

| 插槽名  | 说明                                                                        | 作用域参数      |
| ------- | --------------------------------------------------------------------------- | --------------- |
| default | 自定义气泡内容，覆盖 content 属性,如果开启打字机效果，content会逐渐增多返回 | content: string |
| avatar  | 自定义头像区域                                                              | -               |
| header  | 自定义头部区域                                                              | -               |
| footer  | 自定义底部区域                                                              | -               |

## exposes

| 方法名          | 说明               | 类型         |
| --------------- | ------------------ | ------------ |
| overTyperwriter | 立即完成打字机效果 | `() => void` |
