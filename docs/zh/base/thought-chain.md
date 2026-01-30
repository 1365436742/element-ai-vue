# ThoughtChain 思维链

像AI中深度思考、深度研究，会大量的检索有过程的链式显示。

## 基础用法

:::demo ThoughtChainBase

```vue
<template>
  <ElAThoughtChain :list="list"></ElAThoughtChain>
</template>

<script setup lang="ts">
import { ElAThoughtChain, ThoughtChainItem } from 'element-ai-vue'
import { ref, watch } from 'vue'

const list = ref<ThoughtChainItem[]>([
  {
    key: 1,
    title: '第一步：理解需求',
    description:
      '分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 2,
    title: '第二步：设计架构',
    description: '制定系统架构，选择技术栈和工具。',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 3,
    title: '第三步：编码实现',
    description: '根据设计文档进行编码，完成各项功能。',
    icon: `/assets/search-icon.png`,
  },
  {
    key: 4,
    title: '第四步：测试调试',
    description: '进行单元测试和集成测试，修复发现的问题。',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 5,
    title: '第五步：部署上线',
    description: '将系统部署到生产环境，确保稳定运行。',
    icon: `/assets/search-icon.png`,
  },
  {
    key: 6,
    title: '第五步：部署上线',
    icon: `/assets/search-icon.png`,
  },
])
</script>
```

:::

## 简单模式

:::demo ThoughtChainBaseSimple

```vue
<!-- @include: ../../examples/thought-chain/base-simple.vue -->
```

:::

## 展开收起

:::demo ThoughtChainBaseExtend

```vue
<template>
  <ElAThoughtChain :list="list"></ElAThoughtChain>
</template>

<script setup lang="ts">
import { ElAThoughtChain, ThoughtChainItem } from 'element-ai-vue'
import { ref } from 'vue'

const list = ref<ThoughtChainItem[]>([
  {
    key: 1,
    title: '第一步：理解需求',
    extended: true,
    description:
      '分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 2,
    title: '第二步：设计架构',
    extended: true,
    description: '制定系统架构，选择技术栈和工具。',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 3,
    title: '第三步：编码实现',
    extended: true,
    description: '根据设计文档进行编码，完成各项功能。',
    icon: `/assets/search-icon.png`,
  },
  {
    key: 4,
    title: '第四步：测试调试',
    extended: false,
    description: '进行单元测试和集成测试，修复发现的问题。',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 5,
    title: '第五步：部署上线',
    extended: false,
    description: '将系统部署到生产环境，确保稳定运行。',
    icon: `/assets/search-icon.png`,
  },
  {
    key: 6,
    title: '第五步：部署上线',
    extended: undefined,
    icon: `/assets/search-icon.png`,
  },
])
</script>
```

:::

## 插槽自定义

:::demo ThoughtChainSlot

```vue
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
import { ref, watch } from 'vue'

const list = ref<ThoughtChainItem[]>([
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
    icon: `/assets/book-icon.png`,
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
    icon: `/assets/book-icon.png`,
  },
  {
    key: 6,
    title: '研究完成',
    icon: `/assets/search-icon.png`,
  },
])
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
```

:::

## props

| 属性名 | 说明     | 类型               | 默认值 |
| :----- | :------- | :----------------- | :----- |
| list   | 数据列表 | ThoughtChainItem[] | []     |

## slots

| 插槽名      | 说明       | 作用域参数             |
| :---------- | :--------- | :--------------------- |
| icon        | 自定义图标 | item: ThoughtChainItem |
| title       | 自定义标题 | item: ThoughtChainItem |
| description | 自定义描述 | item: ThoughtChainItem |

## 类型定义

::: tip 可以直接导入

```typescript
import { ThoughtChainItem } from 'element-ai-vue'
```

:::

### ThoughtChainItem

```typescript
interface ThoughtChainItem {
  key?: string | number
  title: string
  /** 是否显示图片 */
  icon?: string
  /** 描述信息，支持插槽 */
  description?: string
  /**
   * true、false 会显示箭头控制收起和展开
   * undfined 不会显示
   */
  extended?: boolean
  /**
   * 隐藏左侧边线
   */
  hiddenLine?: boolean
  [key: string]: any
}
```
