<script setup lang="ts">
import { onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue'
import { ElAMarkdown } from '@element-ai-vue/components'

const content = ref(`# 一级标题
## 二级标题
### 三级标题
#### 四级标题

`)
// const showContent = ref('')
// const timer = ref<number | null>(null)
// onMounted(() => {
//   const lines = content.value.split('\n')
//   const maxIndex = lines.length
//   let index = 0
//   timer.value = window.setInterval(() => {
//     showContent.value += lines[index]
//     /** index随机加0-10 */
//     index++
//     if (index >= maxIndex) {
//       clearInterval(timer.value!)
//     }
//   }, 50)
// })
// onBeforeUnmount(() => {
//   if (timer.value) {
//     clearInterval(timer.value)
//   }
// })
</script>

<template>
  <div class="demo-component">
    <ElAMarkdown :content="content"></ElAMarkdown>
  </div>
</template>

<style scoped>
.demo-component {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}

button {
  padding: 8px 16px;
  background-color: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: var(--vp-c-brand-dark);
}
</style>
