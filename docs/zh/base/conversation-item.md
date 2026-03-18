# ConversationItem 会话列表

## 基础用法

:::demo ConversationItemBase

```vue
<!-- @include: ../../examples/conversation-item/base.vue -->
```

:::

## 插槽

:::demo ConversationItemSlot

```vue
<!-- @include: ../../examples/conversation-item/slot.vue -->
```

:::

## 分组与吸顶

:::demo ConversationItemSticky

```vue
<!-- @include: ../../examples/conversation-item/sticky.vue -->
```

:::

## Props

| 属性名                        | 说明                                | 类型                 | 默认值  |
| ----------------------------- | ----------------------------------- | -------------------- | ------- |
| items                         | 会话列表数据                        | `ConversationItem[]` | `[]`    |
| keyName                       | 指定 `items` 中作为唯一标识的字段名 | `string`             | `'key'` |
| activeKey / v-model:activeKey | 当前激活项的 key 值                 | `string`             | `''`    |
| sticky                        | 是否开启分组标题吸顶                | `boolean`            | `false` |
| theme                         | 主题模式                            | `'dark' \| 'light'`  | —       |

## Events

| 事件名           | 说明                                                | 回调参数                                  |
| ---------------- | --------------------------------------------------- | ----------------------------------------- |
| update:activeKey | 激活项变化时触发，用于 `v-model:activeKey` 双向绑定 | `(value: string)`                         |
| activeChange     | 点击切换激活项时触发                                | `(value: string, item: ConversationItem)` |

## Slots

| 插槽名 | 说明                     | 插槽参数                     |
| ------ | ------------------------ | ---------------------------- |
| item   | 自定义每个会话条目的内容 | `{ item: ConversationItem }` |
| group  | 自定义分组标题的内容     | `{ groupName: string }`      |

## ConversationItem 数据结构

| 字段名        | 说明                                   | 类型      | 是否必填 |
| ------------- | -------------------------------------- | --------- | -------- |
| key           | 唯一标识，与 `keyName` 对应            | `string`  | 否       |
| label         | 显示文本                               | `string`  | 否       |
| group         | 所属分组名称，相同值的条目会被归为一组 | `string`  | 否       |
| disabled      | 是否禁用该条目                         | `boolean` | 否       |
| [key: string] | 支持任意扩展字段，可通过插槽访问       | `any`     | 否       |
