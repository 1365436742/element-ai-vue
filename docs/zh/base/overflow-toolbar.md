# OverflowToolbar 收纳工具栏

当工具栏项目过多，容器宽度不足以显示所有项目时，自动将溢出的项目收纳到"更多"弹出框中。适用于工具栏、标签栏、操作按钮组等场景。

## 基础用法

传入 `list` 数组即可渲染工具栏项目。当容器宽度不足时，超出的项目会自动收起到"更多"弹出框中。

:::demo OverflowToolbarBase

```vue
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

const list = ref<OverflowToolbarItem[]>([
  {
    text: 'Item 1',
    icon: `/assets/search-icon.png`,
    key: 'item-1',
  },
  {
    text: 'Item 2',
    icon: `/assets/search-icon.png`,
    key: 'item-2',
  },
  {
    text: 'Item 3',
    icon: `/assets/search-icon.png`,
    key: 'item-3',
  },
  {
    text: 'Item 4',
    icon: `/assets/search-icon.png`,
    key: 'item-4',
  },
  {
    text: 'Item 5',
    icon: `/assets/search-icon.png`,
    key: 'item-5',
  },
  {
    text: 'Item 6',
    icon: `/assets/search-icon.png`,
    key: 'item-6',
  },
  {
    text: 'Item 7',
    icon: `/assets/search-icon.png`,
    key: 'item-7',
  },
])

const addListItem = () => {
  const newItemIndex = list.value.length + 1
  list.value.push({
    text: `Item ${newItemIndex}`,
    icon: `/assets/search-icon.png`,
    key: `item-${newItemIndex}`,
  })
  overflowToolbarRef.value?.forceUpdate()
}

const removeListItem = () => {
  list.value.pop()
  overflowToolbarRef.value?.forceUpdate()
}
</script>
```

:::

## 自定义插槽

通过 `item`、`more` 和 `more-content` 插槽可以完全自定义工具栏项目和弹出框的样式。

:::demo OverflowToolbarSlot

```vue
<!-- @include: ../../examples/overflow-toolbar/slot.vue -->
```

:::

## props

| 属性名         | 说明                          | 类型                    | 默认值      |
| -------------- | ----------------------------- | ----------------------- | ----------- |
| list           | 工具栏项目列表                | `OverflowToolbarItem[]` | `[]`        |
| trigger        | 弹出框触发方式                | `'click' \| 'hover'`    | `'click'`   |
| visiblePopover | 控制弹出框显示状态（v-model） | `boolean`               | `undefined` |
| minShowNum     | 最小显示个数                  | `number`                | `0`         |

## slots

| 插槽名       | 说明             | 插槽参数                                  |
| ------------ | ---------------- | ----------------------------------------- |
| item         | 自定义工具栏项目 | `{ item: OverflowToolbarItem }`           |
| more         | 自定义"更多"按钮 | -                                         |
| more-content | 自定义弹出框内容 | `{ overflowList: OverflowToolbarItem[] }` |

## methods

通过 `ref` 获取组件实例后可调用以下方法：

| 方法名      | 说明                                         | 类型         |
| ----------- | -------------------------------------------- | ------------ |
| forceUpdate | 强制更新组件，当列表项动态变化后需要手动调用 | `() => void` |

## 类型定义

::: tip 可以直接导入

```typescript
import { OverflowToolbarItem } from 'element-ai-vue'
```

:::

### OverflowToolbarItem

```typescript
interface OverflowToolbarItem {
  /** 唯一标识符  */
  key: string | number
  /** 显示文本 */
  text?: string
  /** 图标地址 */
  icon?: string
  /** 其他自定义属性 */
  [key: string]: any
}
```

## 动态更新列表

当动态添加或删除列表项时，需要调用 `forceUpdate()` 方法来强制刷新组件布局：

```ts
const overflowToolbarRef = useTemplateRef('overflowToolbarRef')

// 添加项目后
list.value.push({ key: 'new-item', text: '新项目' })
overflowToolbarRef.value?.forceUpdate()

// 删除项目后
list.value.pop()
overflowToolbarRef.value?.forceUpdate()
```
