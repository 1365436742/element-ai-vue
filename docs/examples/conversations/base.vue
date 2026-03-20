<template>
  <div class="box-bg">
    <ElAConversations class="box">
      <template #header>
        <ElAConversationCreate
          :shortcutKeys="['Meta_k']"
          @conversation-create-click="handleClick"
        ></ElAConversationCreate>
        <ElAConversationMenu
          class="item-menu"
          :items="menuList"
          v-model:open-keys="openKeys"
          v-model:active-key="activeKey"
        >
          <template #default="{ item }">
            <div class="item-slot">
              <img v-if="item.icon" :src="item.icon" alt="" srcset="" />
              <span>{{ item.label }}</span>
            </div></template
          >
        </ElAConversationMenu>
      </template>
      <template #scroll>
        <ElAConversationItem
          class="item-box"
          :items="list"
          v-model:active-key="activeKey"
        />
      </template>
    </ElAConversations>
  </div>
</template>

<script setup lang="ts">
import {
  ElAConversationCreate,
  ElAConversations,
  ElAConversationItem,
  ConversationItem,
  ElAConversationMenu,
  ConversationMenu,
} from 'element-ai-vue'
import { ref } from 'vue'

const activeKey = ref('')
const openKeys = ref([])

const menuList: ConversationMenu[] = [
  {
    key: 'menu-1',
    label: 'AI 创作',
    icon: '/logo.svg',
  },
  {
    key: 'menu-2',
    label: '云盘',
    icon: '/logo.svg',
  },
  {
    key: 'menu-3',
    icon: '/logo.svg',
    label: '更多',
    children: [
      {
        key: '4-1',
        label: '应用生成',
      },
      {
        key: '4-2',
        label: 'AI Agent',
      },
    ],
  },
]

const list = ref<ConversationItem[]>([
  {
    key: '-1',
    label: '如何快速上手 Vue3 组合式 API？',
  },
  {
    key: '1',
    label: '如何快速上手 Vue3 组合式组合式组合式 API？',
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
])

const handleClick = () => {
  const key = list.value.length + 2
  list.value.push({
    key: key + '',
    label: 'React 和 Vue 框架对比分析',
    group: '更早',
  })
}
</script>

<style scoped lang="scss">
html.dark {
  .box-bg {
    background-color: rgb(48, 48, 48);
    .box {
      --el-ai-conversation-item-bg-color: black;
    }
  }
}

.box-bg {
  background-color: rgb(240, 242, 245);
  padding: 20px;
  .box {
    width: 256px;
    height: 600px;
    padding: 12px;
    --el-ai-conversation-item-bg-color: #fff;
    border-radius: 6px;
    .item-menu {
      margin-top: 4px;
    }
    .item-slot {
      display: flex;
      align-items: center;
      > img {
        width: 16px;
        height: 16px;
        margin-right: 8px;
      }
      > span {
        display: block;
        flex: 1;
        width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
