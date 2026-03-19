# ConversationMenu 导航菜单

## 基础用法

:::demo ConversationMenuBase

```vue
<!-- @include: ../../examples/conversation-menu/base.vue -->
```

:::

## 插槽

:::demo ConversationMenuSlot

```vue
<!-- @include: ../../examples/conversation-menu/slot.vue -->
```

:::

## Props

| 属性名                          | 说明                                | 类型                 | 默认值  |
| ------------------------------- | ----------------------------------- | -------------------- | ------- |
| items                           | 菜单数据列表                        | `ConversationMenu[]` | `[]`    |
| keyName                         | 指定 `items` 中作为唯一标识的字段名 | `string`             | `'key'` |
| activeKey / v-model:activeKey   | 当前激活项的 key 值                 | `string`             | `''`    |
| openKeys / v-model:openKeys     | 当前展开的子菜单 key 数组           | `string[]`           | `[]`    |
| theme                           | 主题模式                            | `'dark' \| 'light'`  | —       |

## Events

| 事件名           | 说明                                                        | 回调参数           |
| ---------------- | ----------------------------------------------------------- | ------------------ |
| update:activeKey | 激活项变化时触发，用于 `v-model:activeKey` 双向绑定         | `(value: string)`  |
| update:openKeys  | 展开项变化时触发，用于 `v-model:openKeys` 双向绑定          | `(value: string[])` |

## Slots

| 插槽名  | 说明                                                           | 插槽参数                    |
| ------- | -------------------------------------------------------------- | --------------------------- |
| default | 自定义每个菜单项的内容，默认使用 `TextOverflowTooltip` 展示文本 | `{ item: ConversationMenu }` |

## ConversationMenu 数据结构

| 字段名        | 说明                                     | 类型                   | 是否必填 |
| ------------- | ---------------------------------------- | ---------------------- | -------- |
| key           | 唯一标识，与 `keyName` 对应              | `string`               | 否       |
| label         | 显示文本                                 | `string`               | 否       |
| disabled      | 是否禁用该项                             | `boolean`              | 否       |
| children      | 子菜单列表，存在时该项作为折叠父节点     | `ConversationMenu[]`   | 否       |
| [key: string] | 支持任意扩展字段，可通过插槽访问         | `any`                  | 否       |
