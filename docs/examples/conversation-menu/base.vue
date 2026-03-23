<template>
  <div class="box-bg">
    <ElAConversationMenu
      class="item-box"
      :items="list"
      v-model:open-keys="openKeys"
      v-model:active-key="activeKey"
    >
    </ElAConversationMenu>
  </div>
</template>

<script setup lang="ts">
import { ConversationMenu, ElAConversationMenu } from 'element-ai-vue'
import { ref } from 'vue'

const activeKey = ref('')
const openKeys = ref([])

const list: ConversationMenu[] = [
  {
    key: '1',
    label: 'Vue3 开发指南',
    children: [
      {
        key: '1-1',
        label: '如何快速上手 Vue3 组合式 API？',
      },
      {
        key: '1-2',
        label: 'Vue3 响应式原理深度解析',
      },
      {
        key: '1-3',
        label: 'Vue3 中如何使用 Teleport？',
        disabled: true,
      },
    ],
  },
  {
    key: '2',
    label: 'TypeScript 学习笔记',
    children: [
      {
        key: '2-1',
        label: 'TypeScript 泛型有哪些使用技巧？',
      },
      {
        key: '2-2',
        label: 'TypeScript 装饰器使用指南',
        children: [
          {
            key: '2-2-1',
            label: '类装饰器详解',
          },
          {
            key: '2-2-2',
            label: '方法装饰器详解',
          },
        ],
      },
    ],
  },
  {
    key: '3',
    label: '帮我写一个防抖函数',
  },
  {
    key: '4',
    label: '前端工程化',
    children: [
      {
        key: '4-1',
        label: 'Pinia 和 Vuex 有什么区别？',
      },
      {
        key: '4-2',
        label: 'Vite 构建工具使用教程',
      },
      {
        key: '4-3',
        label: '如何优化前端页面加载性能？',
      },
    ],
  },
  {
    key: '5',
    label: 'CSS 布局技巧',
    children: [
      {
        key: '5-1',
        label: 'CSS Flexbox 布局常见问题解答',
      },
      {
        key: '5-2',
        label: 'CSS Grid 布局实战指南',
      },
    ],
  },
  {
    key: '6',
    label: 'Node.js 异步编程最佳实践',
  },
  {
    key: '7',
    label: 'React 和 Vue 框架对比分析',
    disabled: true,
  },
]
</script>
<style scoped lang="scss">
html.dark {
  .box-bg {
    background-color: rgb(48, 48, 48);
    .item-box {
      --el-ai-conversation-item-bg-color: black;
    }
  }
}

.box-bg {
  background-color: rgb(240, 242, 245);
  padding: 20px;
  .item-box {
    max-width: 256px;
    padding: 12px;
    --el-ai-conversation-item-bg-color: #fff;
    border-radius: 6px;
  }
}
</style>
