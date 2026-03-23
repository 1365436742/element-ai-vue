<template>
  <div class="box-bg">
    <ElAConversationItem
      class="item-box"
      :items="list"
      v-model:active-key="activeKey"
    />
  </div>
</template>

<script setup lang="ts">
import { ConversationItem, ElAConversationItem } from 'element-ai-vue'
import { ref } from 'vue'

const activeKey = ref('')

const list: ConversationItem[] = [
  {
    key: '-1',
    label: '如何快速上手 Vue3 组合式 API？',
  },
  {
    key: '1',
    label: '如何快速上手 Vue3 组合式 API？',
    group: '今天',
  },
  {
    key: '2',
    label: 'TypeScript 泛型有哪些使用技巧？',
    group: '今天',
  },
  {
    key: '3',
    label: '帮我写一个防抖函数',
    group: '今天',
  },
  {
    key: '4',
    label: 'Pinia 和 Vuex 有什么区别？',
    group: '昨天',
  },
  {
    key: '5',
    label: 'CSS Flexbox 布局常见问题解答',
    group: '昨天',
  },
  {
    key: '6',
    label: '如何优化前端页面加载性能？',
    group: '昨天',
  },
  {
    key: '7',
    label: 'Node.js 异步编程最佳实践',
    group: '更早',
  },
  {
    key: '8',
    label: 'React 和 Vue 框架对比分析',
    group: '更早',
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

<style lang="scss">
.vp-doc li + li {
  margin-top: 0 !important;
}
</style>
