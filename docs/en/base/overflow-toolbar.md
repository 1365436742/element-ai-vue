# OverflowToolbar

When there are too many toolbar items and the container width is insufficient to display all items, the overflow items are automatically collapsed into a "More" popover. Suitable for toolbars, tab bars, action button groups, and similar scenarios.

## Basic Usage

Pass a `list` array to render toolbar items. When the container width is insufficient, excess items will automatically collapse into a "More" popover.

:::demo OverflowToolbarBase

```vue
<template>
  <div class="btns">
    <button class="switch-btn" @click="addListItem()">Add Item</button>
    <button class="switch-btn" @click="removeListItem()">Remove Item</button>
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
import { ref, useTemplateRef, watch } from 'vue'
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

## Custom Slots

You can fully customize the toolbar items and popover styles through the `item`, `more`, and `more-content` slots.

:::demo OverflowToolbarSlot

```vue
<!-- @include: ../../examples/overflow-toolbar/slot.vue -->
```

:::

## Props

| Name           | Description                          | Type                    | Default     |
| -------------- | ------------------------------------ | ----------------------- | ----------- |
| list           | Toolbar item list                    | `OverflowToolbarItem[]` | `[]`        |
| trigger        | Popover trigger method               | `'click' \| 'hover'`    | `'click'`   |
| visiblePopover | Control popover visibility (v-model) | `boolean`               | `undefined` |
| minShowNum     | Minimum number of items to display   | `number`                | `0`         |

## Slots

| Name         | Description            | Slot Props                                |
| ------------ | ---------------------- | ----------------------------------------- |
| item         | Custom toolbar item    | `{ item: OverflowToolbarItem }`           |
| more         | Custom "More" button   | -                                         |
| more-content | Custom popover content | `{ overflowList: OverflowToolbarItem[] }` |

## Methods

The following methods can be called after obtaining the component instance via `ref`:

| Name        | Description                                                        | Type         |
| ----------- | ------------------------------------------------------------------ | ------------ |
| forceUpdate | Force update the component, must be called after list items change | `() => void` |

## Type Definitions

::: tip Can be imported directly

```typescript
import { OverflowToolbarItem } from 'element-ai-vue'
```

:::

### OverflowToolbarItem

```typescript
interface OverflowToolbarItem {
  /** Unique identifier */
  key: string | number
  /** Display text */
  text?: string
  /** Icon URL */
  icon?: string
  /** Other custom properties */
  [key: string]: any
}
```

## Dynamic List Updates

When dynamically adding or removing list items, you need to call the `forceUpdate()` method to force refresh the component layout:

```ts
const overflowToolbarRef = useTemplateRef('overflowToolbarRef')

// After adding an item
list.value.push({ key: 'new-item', text: 'New Item' })
overflowToolbarRef.value?.forceUpdate()

// After removing an item
list.value.pop()
overflowToolbarRef.value?.forceUpdate()
```
