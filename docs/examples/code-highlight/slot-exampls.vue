<template>
  <ElACodeHighlight language="javascript" :content="content">
    <template #header="{ content, language, isCopied, onCopy }">
      <div class="header">
        <div>{{ language }}</div>
        <button @click="onCopy">{{ isCopied ? '已复制' : '复制' }}</button>
      </div>
    </template>
  </ElACodeHighlight>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElACodeHighlight } from 'element-ai-vue'

const content = ref(`/**
 * 生成指定区间 [min, max] 的随机整数（包含 min 和 max）
 * @param {number} min - 最小值（整数）
 * @param {number} max - 最大值（整数）
 * @returns {number} 随机整数
 */
function getRandomInt(min, max) {
  // 先取整避免非整数参数问题，再计算区间
  min = Math.ceil(min);
  max = Math.floor(max);
  // Math.random() 生成 [0,1)，计算后得到 [min, max]
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 示例：生成 1 到 10 之间的随机整数（包含1和10）
console.log(getRandomInt(1, 10)); // 输出：1~10 之间的随机数`)
</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #000;
  padding: 8px;
  color: #fff;
}
</style>
