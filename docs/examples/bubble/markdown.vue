<template>
  <div class="base-box">
    <!-- 借助 vueuse定义模版 -->
    <DefineTemplate
      v-slot="{ content, placement, loading, isMarkdown, typing, variant }"
    >
      <ElABubble
        :content
        :placement
        :loading
        :typing
        :is-markdown
        :variant
        :theme="isDark ? 'dark' : 'light'"
      >
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
import { useData } from 'vitepress'

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

const { isDark } = useData()

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
