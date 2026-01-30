<template>
  <div class="box">
    <ElABubble content="filled - default" />
    <ElABubble content="filled - round" shape="round" />
    <ElABubble content="filled - corner left" shape="corner" />
    <ElABubble content="filled - corner right" shape="corner" placement="end" />
  </div>
  <div class="box">
    <ElABubble content="outlined - default" variant="outlined" />
    <ElABubble content="outlined - round" variant="outlined" shape="round" />
    <ElABubble
      content="outlined - corner left"
      variant="outlined"
      shape="corner"
    />
    <ElABubble
      content="outlined - corner right"
      variant="outlined"
      shape="corner"
      placement="end"
    />
  </div>
  <div class="box">
    <ElABubble content="shadow - default" variant="shadow" />
    <ElABubble content="shadow - round" variant="shadow" shape="round" />
    <ElABubble content="shadow - corner left" variant="shadow" shape="corner" />
    <ElABubble
      content="shadow - corner right"
      variant="shadow"
      shape="corner"
      placement="end"
    />
  </div>
  <div class="box">
    <ElABubble content="borderless bubble" variant="borderless" />
  </div>
</template>

<script setup lang="ts">
import { ElABubble } from 'element-ai-vue'
</script>

<style scoped lang="scss">
.box {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  flex-shrink: 0;
  :deep(.el-ai-bubble__content-wrapper) {
    width: auto;
  }
}
</style>
