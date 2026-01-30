<template>
  <div class="btns">
    <button class="switch-btn" @click="addListItem()">动态添加item</button>
    <button class="switch-btn" @click="removeListItem()">动态删除item</button>
  </div>
  <div :style="{ width: '100%', overflow: 'hidden' }">
    <ElAOverflowToolbar ref="overflowToolbarRef" :list="list">
      <template #item="{ item }">
        <button class="toolbar-btn">
          <span class="toolbar-btn-icon">{{ item.icon }}</span>
          <span class="toolbar-btn-text">{{ item.text }}</span>
        </button>
      </template>
      <template #more>
        <button class="toolbar-btn">
          <span class="toolbar-btn-icon">📦</span>
          <span class="toolbar-btn-text">更多</span>
        </button>
      </template>
      <template #more-content="{ overflowList }">
        <div class="more-content-list">
          <button
            v-for="item in overflowList"
            :key="item.key"
            class="more-content-item"
          >
            <span class="more-content-icon">{{ item.icon }}</span>
            <span class="more-content-text">{{ item.text }}</span>
          </button>
        </div>
      </template>
    </ElAOverflowToolbar>
  </div>
</template>

<script setup lang="ts">
import { ElAOverflowToolbar, OverflowToolbarItem } from 'element-ai-vue'
import { ref, useTemplateRef } from 'vue'

const overflowToolbarRef = useTemplateRef('overflowToolbarRef')

const icons = ['✏️', '🌐', '🎙️', '🎧', '📝', '📊', '📑', '⚡']

const setList = () => {
  list.value = [
    { text: '帮我写作', icon: '✏️', key: 'item-1' },
    { text: '翻译', icon: '🌐', key: 'item-2' },
    { text: '记录会议', icon: '🎙️', key: 'item-3' },
    { text: 'AI播客', icon: '🎧', key: 'item-4' },
    { text: '解题答疑', icon: '📝', key: 'item-5' },
    { text: '数据分析', icon: '📊', key: 'item-6' },
    { text: 'PPT生成', icon: '📑', key: 'item-7' },
  ]
}
const list = ref<(OverflowToolbarItem & { image?: string })[]>([])
setList()

const addListItem = () => {
  const newItemIndex = list.value.length + 1
  list.value.push({
    text: `Item ${newItemIndex}`,
    icon: icons[(newItemIndex - 1) % icons.length],
    key: `item-${newItemIndex}`,
  })
  overflowToolbarRef.value?.forceUpdate()
}

const removeListItem = () => {
  list.value.pop()
  overflowToolbarRef.value?.forceUpdate()
}
</script>

<style scoped>
.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid #e5e6eb;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toolbar-btn-icon {
  font-size: 16px;
}

.toolbar-btn-text {
  font-weight: 400;
}

.more-content-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0px;
  min-width: 120px;
}

.more-content-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  transition: background 0.2s ease;
}
.dark .more-content-item:hover {
  background: rgba(255, 255, 255, 0.1);
}
.more-content-item:hover {
  background: rgba(0, 0, 0, 0.1);
}

.more-content-icon {
  font-size: 18px;
}

.more-content-text {
  font-weight: 400;
}
</style>
