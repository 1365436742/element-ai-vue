<template>
  <div class="tooltip-demo">
    <h3>基础用法 (Basic)</h3>
    <div class="demo-row">
      <ElATooltip content="这是一个提示信息">
        <button class="demo-btn">Hover 触发</button>
      </ElATooltip>

      <ElATooltip content="点击触发的提示" trigger="click">
        <button class="demo-btn">Click 触发</button>
      </ElATooltip>
    </div>

    <h3>不同位置 (Placement)</h3>
    <div class="demo-row">
      <ElATooltip content="Top 位置" placement="top">
        <button class="demo-btn">Top</button>
      </ElATooltip>

      <ElATooltip content="Bottom 位置" placement="bottom">
        <button class="demo-btn">Bottom</button>
      </ElATooltip>

      <ElATooltip content="Left 位置" placement="left">
        <button class="demo-btn">Left</button>
      </ElATooltip>

      <ElATooltip content="Right 位置" placement="right">
        <button class="demo-btn">Right</button>
      </ElATooltip>
    </div>

    <h3>主题效果 (Effect)</h3>
    <div class="demo-row">
      <ElATooltip content="暗色主题 (Dark)" effect="dark">
        <button class="demo-btn">Dark</button>
      </ElATooltip>

      <ElATooltip content="亮色主题 (Light)" effect="light">
        <button class="demo-btn">Light</button>
      </ElATooltip>
    </div>

    <h3>自定义内容 (Custom Content)</h3>
    <div class="demo-row">
      <ElATooltip placement="top">
        <template #content>
          <div>
            <strong>自定义标题</strong>
            <p style="margin: 4px 0 0 0">这里是自定义内容</p>
          </div>
        </template>
        <button class="demo-btn">自定义内容</button>
      </ElATooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElATooltip } from '@element-ai-vue/components'
</script>

<style scoped>
.tooltip-demo {
  padding: 20px;
}

.demo-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.demo-btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.demo-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

h3 {
  margin: 16px 0 12px;
  font-size: 16px;
  color: #303133;
}
</style>
