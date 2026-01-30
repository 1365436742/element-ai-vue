<template>
  <div class="btns">
    <button class="switch-btn" @click="addListItem()">动态添加item</button>
    <button class="switch-btn" @click="removeListItem()">动态删除item</button>
  </div>
  <div :style="{ width: '100%', overflow: 'hidden' }">
    <ElAOverflowToolbar
      ref="overflowToolbarRef"
      :list="list"
    ></ElAOverflowToolbar>
  </div>
</template>

<script setup lang="ts">
import { ElAOverflowToolbar, OverflowToolbarItem } from 'element-ai-vue'
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const overflowToolbarRef = useTemplateRef('overflowToolbarRef')

const setList = () => {
  list.value = [
    {
      text: 'Item 1',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
      key: 'item-1',
    },
    {
      text: 'Item 2',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
      key: 'item-2',
    },
    {
      text: 'Item 3',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
      key: 'item-3',
    },
    {
      text: 'Item 4',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
      key: 'item-4',
    },
    {
      text: 'Item 5',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
      key: 'item-5',
    },
    {
      text: 'Item 6',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
      key: 'item-6',
    },
    {
      text: 'Item 7',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
      key: 'item-7',
    },
  ]
}
const list = ref<OverflowToolbarItem[]>([])
setList()

const addListItem = () => {
  const newItemIndex = list.value.length + 1
  list.value.push({
    text: `Item ${newItemIndex}`,
    icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
    key: `item-${newItemIndex}`,
  })
  overflowToolbarRef.value?.forceUpdate()
}

const removeListItem = () => {
  list.value.pop()
  overflowToolbarRef.value?.forceUpdate()
}

watch(isDark, () => {
  list.value = list.value.map((item, index) => ({
    ...item,
    icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
  }))
})
</script>
