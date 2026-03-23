<template>
  <div class="btns">
    <button class="switch-btn" @click="collapse = false">打开</button>
    <button class="switch-btn" @click="collapse = true">收起</button>
  </div>
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
            <div class="item-slot" @click="handleClickMenu($event, item)">
              <img v-if="item.icon" :src="item.icon" alt="" srcset="" />
              <span>{{ item.label }}</span>
              <div v-if="item.link" class="link">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M6.757 5.636a1 1 0 0 1 1-1h10.607a1 1 0 0 1 1 1v10.606a1 1 0 0 1-2 0V8.05L6.343 19.07a1 1 0 0 1-1.414-1.413l11.02-11.021H7.757a1 1 0 0 1-1-1"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </div>
            </div>
          </template>
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
const collapse = ref(false)

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
        label: '去百度看看',
        link: 'https://www.baidu.com/',
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
  {
    key: '9',
    label: '如何优化前端首屏加载速度？',
    group: '7 天内',
  },
  {
    key: '10',
    label: 'Node.js 异步编程最佳实践',
    group: '7 天内',
  },
  {
    key: '11',
    label: '写一个深拷贝函数',
    group: '更早',
  },
])

const handleClick = () => {
  const key = list.value.length + 2
  list.value.unshift({
    key: key + '',
    label: 'React 和 Vue 框架对比分析',
    group: '今天',
  })
}

const handleClickMenu = (e: Event, item: ConversationMenu) => {
  if (item.link) {
    e.stopPropagation()
    window.open(item.link)
  }
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
    max-width: 256px;
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
