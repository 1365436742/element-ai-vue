<template>
  <div class="create-item">
    <div>
      <ElAConversationCreate
        :shortcutKeys="['Meta_k']"
        @conversation-create-click="handleClick"
      ></ElAConversationCreate>
    </div>
    <div>
      <ElAConversationCreate
        :shortcut-keys="['Meta_x']"
        @conversation-create-click="handleClick"
      >
        <template #icon>
          <img class="image" src="/logo.svg" alt="" srcset="" />
        </template>
        <template #default>开启新对话</template>
        <template #end>
          <div class="end-box">
            <span>⌘</span>
            <span>x</span>
          </div>
        </template>
      </ElAConversationCreate>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElAConversationCreate } from 'element-ai-vue'
const handleClick = () => {
  // oxlint-disable-next-line no-console
  console.log('点击了创建按钮')
}
</script>

<style scoped lang="scss">
.create-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 256px;
  .image {
    height: 20px;
  }
  .end-box {
    display: flex;
    align-items: center;
    margin-right: 6px;
    gap: 4px;
    > span {
      display: flex;
      align-items: center;
      font-size: 12px;
      height: 16px;
      padding: 0 4px;
    }
  }
}
</style>
