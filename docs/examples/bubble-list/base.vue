<template>
  <div class="btns">
    <button class="switch-btn" @click="start">对话</button>
  </div>
  <div class="btns">
    <button class="switch-btn" @click="bubbleListRef?.scrollToTop()">
      滚动顶部
    </button>
    <button class="switch-btn" @click="bubbleListRef?.scrollToBottom()">
      滚动底部
    </button>
    <button class="switch-btn" @click="bubbleListRef?.scrollToIndex(1)">
      滚动第二个
    </button>
  </div>
  <div class="base-list">
    <ElABubbleList ref="bubbleListRef" class="scroll-area">
      <ElABubble v-for="item in list" v-bind="item" footer-trigger="hover">
        <template #footer>
          <div class="actions" :class="item.placement">
            <span class="element-ai-vue-iconfont icon-copy"></span>
            <span class="element-ai-vue-iconfont icon-regen"></span>
          </div>
        </template>
      </ElABubble>
    </ElABubbleList>
  </div>
</template>

<script setup lang="ts">
import { ElABubbleList, ElABubble } from 'element-ai-vue'
import { onMounted, ref, useTemplateRef } from 'vue'

const bubbleListRef = useTemplateRef('bubbleListRef')
const list = ref<any[]>([
  {
    content: '你好我是element-ai-vue',
    placement: 'end',
    isMarkdown: false,
    loading: false,
    typing: false,
  },
])

const start = () => {
  const role = list.value.length % 2 === 0 ? 'user' : 'assistant'
  list.value.push({
    content: '你好我是element-ai-vue',
    placement: role === 'user' ? 'end' : 'start',
    isMarkdown: role === 'assistant',
    typing: role === 'assistant',
    variant: role === 'assistant' ? 'borderless' : 'default',
  })
}
onMounted(() => {
  for (let i = 0; i < 10; i++) {
    start()
  }
})
</script>

<style scoped lang="scss">
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
