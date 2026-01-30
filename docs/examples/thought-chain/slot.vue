<template>
  <ElAThoughtChain :list="list">
    <template #description="{ item }">
      <div class="description-with-links">
        <div
          v-if="item.searchList && item.searchList.length > 0"
          class="search-links"
        >
          <div v-for="(searchItem, idx) in item.searchList" :key="idx">
            <a
              :href="searchItem.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ searchItem.title }}
            </a>
          </div>
        </div>
      </div>
    </template>
  </ElAThoughtChain>
</template>

<script setup lang="ts">
import { ElAThoughtChain, ThoughtChainItem } from 'element-ai-vue'
import { useData } from 'vitepress'
import { ref, watch } from 'vue'

const { isDark } = useData()

const setList = () => {
  list.value = [
    {
      key: 1,
      title: '第一步：理解需求',
      description: '求，明确目标和功能。',
      searchList: [
        {
          title: '北京地铁线路图 主要景点 地铁站',
          href: '/',
        },
        {
          title: '北京地铁线路图 主要景点 地铁站',
          href: '/',
        },
        {
          title: 'visitbeijing.com.cn',
          href: '/',
        },
        {
          title: 'm.toutiao.com',
          href: '/',
        },
        {
          title: 'visitbeijing.com.cn',
          href: '/',
        },
        {
          title: 'm.toutiao.com',
          href: '/',
        },
        {
          title: 'visitbeijing.com.cn',
          href: '/',
        },
        {
          title: 'm.toutiao.com',
          href: '/',
        },
      ],
      icon: `/assets/book-icon${isDark.value ? '-dark' : ''}.png`,
    },
    {
      key: 2,
      title: '第二步：设计架构',
      description: '制定系统架构，选择技术栈和工具。',
      searchList: [
        {
          title: '北京公交系统 旅游专线 景点直通车',
          href: '/',
        },
      ],
      icon: `/assets/book-icon${isDark.value ? '-dark' : ''}.png`,
    },
    {
      key: 6,
      title: '研究完成',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
    },
  ]
}
const list = ref<ThoughtChainItem[]>([])

watch(
  isDark,
  () => {
    setList()
  },
  {
    immediate: true,
  }
)
</script>

<style scoped lang="scss">
.description-with-links {
  margin-top: 8px;
  .search-links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    a {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      background-color: #f2f3f5;
      border-radius: 8px;
      color: #303133;
      text-decoration: none;
      font-size: 13px;
      line-height: 20px;
      transition: background-color 0.2s;
      &:hover {
        background-color: #e6e7eb;
      }
      &::before {
        content: '';
        width: 14px;
        height: 14px;
        margin-right: 4px;
        background-image: url('/assets/search-icon.png');
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
      }
    }
  }
}
html.dark {
  .description-with-links .search-links {
    a {
      background-color: #262626;
      color: #cfd3dc;
      &:hover {
        background-color: #303030;
      }
      &::before {
        background-image: url('/assets/search-icon-dark.png');
      }
    }
  }
}
</style>
