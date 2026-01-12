# ThoughtChain

For AI deep thinking and deep research scenarios, displaying extensive retrieval processes in a chain format.

## Basic Usage

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
    title: 'Step 1: Understand Requirements',
    description:
      'Analyze user requirements, clarify goals and features. Analyze user requirements, clarify goals and features. Analyze user requirements, clarify goals and features. Analyze user requirements, clarify goals and features. Analyze user requirements, clarify goals and features. Analyze user requirements, clarify goals and features. Analyze user requirements, clarify goals and features. Analyze user requirements, clarify goals and features.',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 2,
    title: 'Step 2: Design Architecture',
    description: 'Create system architecture, choose tech stack and tools.',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 3,
    title: 'Step 3: Implementation',
    description: 'Code according to design documents, complete features.',
    icon: `/assets/search-icon.png`,
  },
  {
    key: 4,
    title: 'Step 4: Testing & Debugging',
    description: 'Perform unit tests and integration tests, fix issues.',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 5,
    title: 'Step 5: Deployment',
    description: 'Deploy system to production, ensure stable operation.',
    icon: `/assets/search-icon.png`,
  },
  {
    key: 6,
    title: 'Step 5: Deployment',
    icon: `/assets/search-icon.png`,
  },
])
</script>
```

:::

## Simple Mode

:::demo ThoughtChainBaseSimple

```vue
<!-- @include: ../../examples/thought-chain/base-simple.vue -->
```

:::

## Expand/Collapse

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
    title: 'Step 1: Understand Requirements',
    extended: true,
    description:
      'Analyze user requirements, clarify goals and functions. Analyze user requirements, clarify goals and functions. Analyze user requirements, clarify goals and functions. Analyze user requirements, clarify goals and functions. Analyze user requirements, clarify goals and functions. Analyze user requirements, clarify goals and functions. Analyze user requirements, clarify goals and functions.',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 2,
    title: 'Step 2: Design Architecture',
    extended: true,
    description:
      'Develop system architecture, select technology stack and tools.',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 3,
    title: 'Step 3: Implementation',
    extended: true,
    description:
      'Code according to design documents, complete various functions.',
    icon: `/assets/search-icon.png`,
  },
  {
    key: 4,
    title: 'Step 4: Testing & Debugging',
    extended: false,
    description:
      'Conduct unit testing and integration testing, fix discovered issues.',
    icon: `/assets/book-icon.png`,
  },
  {
    key: 5,
    title: 'Step 5: Deployment',
    extended: false,
    description:
      'Deploy the system to the production environment, ensure stable operation.',
    icon: `/assets/search-icon.png`,
  },
  {
    key: 6,
    title: 'Step 6: Completion',
    extended: undefined,
    icon: `/assets/search-icon.png`,
  },
])
</script>
```

:::

## Custom Slots

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
    title: 'Step 1: Understand Requirements',
    description: 'Clarify goals and features.',
    searchList: [
      {
        title: 'Beijing Subway Map Main Attractions Station',
        href: '/',
      },
      {
        title: 'Beijing Subway Map Main Attractions Station',
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
    title: 'Step 2: Design Architecture',
    description: 'Create system architecture, choose tech stack and tools.',
    searchList: [
      {
        title: 'Beijing Public Transit Tourist Bus Direct Routes',
        href: '/',
      },
    ],
    icon: `/assets/book-icon.png`,
  },
  {
    key: 6,
    title: 'Research Complete',
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

## Props

| Property | Description | Type               | Default |
| :------- | :---------- | :----------------- | :------ |
| list     | Data list   | ThoughtChainItem[] | []      |

## Slots

| Slot Name   | Description        | Scope Parameters       |
| :---------- | :----------------- | :--------------------- |
| icon        | Custom icon        | item: ThoughtChainItem |
| title       | Custom title       | item: ThoughtChainItem |
| description | Custom description | item: ThoughtChainItem |

## Type Definitions

::: tip Can be imported directly

```typescript
import { ThoughtChainItem } from 'element-ai-vue'
```

:::

### ThoughtChainItem

```typescript
interface ThoughtChainItem {
  key?: string | number
  title: string
  /** Whether to show image */
  icon?: string
  /** Description information, supports slots */
  description?: string
  /**
   * true, false will show arrow to control collapse and expand
   * undefined will not show
   */
  extended?: boolean
  /**
   * Hide left border line
   */
  hiddenLine?: boolean
  [key: string]: any
}
```
