<template>
  <div class="wapper" :class="{ 'focus-class': focusClass }">
    <ElASender
      v-model="content"
      :placeholder
      :variant
      :extensions
      @focus="focusClass = true"
      @blur="focusClass = false"
    >
    </ElASender>
  </div>
</template>

<script setup lang="ts">
import { ElASender } from 'element-ai-vue'
import { ref } from 'vue'
import Mention from '@tiptap/extension-mention'
import suggestions from './metion/suggestions'

const content = ref(``)
const variant = ref<'default' | 'updown'>('default')
const focusClass = ref(false)

const placeholder = ref(`请输入聊天内容`)
const extensions = [
  Mention.configure({
    HTMLAttributes: {
      class: 'mention',
    },
    suggestions: suggestions,
  }),
]
</script>

<style scoped lang="scss">
html.dark {
  .wapper {
    border-color: rgba(121, 121, 121, 0.6);

    &.focus-class {
      border-color: rgba($color: #fff, $alpha: 0.6);
    }
  }
}
:deep(.tiptap .mention) {
  background-color: rgba(88, 5, 255, 0.05);
  border-radius: 0.4rem;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  color: #8e6bbb;
  padding: 0.1rem 0.3rem;
}
.wapper {
  width: 100%;
  border-radius: 8px;
  padding: 8px;
  border: 1px solid rgba(17, 25, 37, 0.15);

  &.focus-class {
    border-color: rgba(17, 25, 37, 0.45);
  }
}
</style>
