<template>
  <div class="btns">
    <button class="switch-btn" @click="start()">对话</button>
  </div>
  <div class="base-list">
    <ElABubbleList class="scroll-area">
      <ElABubble
        v-for="item in list"
        v-bind="item"
        footer-trigger="hover"
        :markdown-props="{ codeMermaidProps: { disabledZoom: ['wheel'] } }"
      >
        <template #header v-if="item.placement === 'start'">
          <ElAThinking title="今日话题 AI时代">
            <div class="think">{{ item.thinks }}</div>
          </ElAThinking>
        </template>
        <template #footer>
          <div class="actions" :class="item.placement">
            <span class="element-ai-vue-iconfont icon-copy"></span>
            <span class="element-ai-vue-iconfont icon-regen"></span>
          </div>
        </template>
      </ElABubble>
      <template #bottom-action="{ scrollToTop, scrollToBottom, scrollToIndex }">
        <div class="bottom-action-btns">
          <button class="switch-btn" @click="scrollToTop()">滚动顶部</button>
          <button class="switch-btn" @click="scrollToBottom()">滚动底部</button>
          <button class="switch-btn" @click="scrollToIndex(1)">
            滚动第二个
          </button>
        </div>
      </template>
    </ElABubbleList>
  </div>
</template>

<script setup lang="ts">
import { ElABubbleList, ElABubble, ElAThinking } from 'element-ai-vue'
import { onMounted, ref } from 'vue'

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

const list = ref<any[]>([
  {
    content: '你好我是element-ai-vue',
    placement: 'end',
    isMarkdown: false,
    loading: false,
    typing: false,
  },
])

const start = (typing?: boolean) => {
  const role = list.value.length % 2 === 0 ? 'user' : 'assistant'
  list.value.push({
    content: role === 'user' ? '你好我是element-ai-vue' : mdContent,
    placement: role === 'user' ? 'end' : 'start',
    isMarkdown: role === 'assistant',
    typing: typing ?? role === 'assistant',
    variant: role === 'assistant' ? 'borderless' : 'default',
    thinks:
      '你好，我是Element AI Vue，一个基于Vue3和TypeScript构建的AI组件库，致力于为开发者提供便捷、高效的AI解决方案。',
  })
}
onMounted(() => {
  for (let i = 0; i < 2; i++) {
    start(false)
  }
})
</script>

<style scoped lang="scss">
html.dark {
  .think {
    color: rgba(255, 255, 255, 0.65);
  }
}
.bottom-action-btns {
  text-align: center;
}
.think {
  padding: 0 12px 10px;
  color: rgba(17, 25, 37, 0.45);
  font-size: 14px;
}
.scroll-area {
  padding: 10px;
}
.base-list {
  height: 400px;
  border: 1px solid #000;
  padding: 8px;
  box-sizing: border-box;
  .lite-item {
    line-height: 50px;
  }
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
</style>
