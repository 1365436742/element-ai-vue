# Conversations 会话管理

## 基础用法

:::demo ConversationsBase

```vue
<!-- @include: ../../examples/conversations/base.vue -->
```

:::

## 滚动加载

:::demo ConversationsLoadMore

```vue
<!-- @include: ../../examples/conversations/loadMore.vue -->
```

:::

:::details ./mock.ts file

::: code-group

<<< ../../examples/conversations/mock.ts

:::

## 展开收起&支持移动端

:::demo ConversationsMobile

```vue
<!-- @include: ../../examples/conversations/mobile.vue -->
```

:::

### ElAConversations Props

| 参数名  | 说明                                   | 类型                  | 默认值  |
| ------- | -------------------------------------- | --------------------- | ------- |
| theme   | 主题风格                               | `'dark' \| 'light'`   | —       |
| hasMore | 是否还有更多数据可加载                 | `boolean`             | `false` |
| onNext  | 加载更多数据的回调函数，需返回 Promise | `() => Promise<void>` | —       |

### ElAConversations Slots

| 插槽名  | 说明             |
| ------- | ---------------- |
| header  | 顶部区域         |
| scroll  | 滚动列表区域     |
| loading | 自定义加载中内容 |
| footer  | 底部区域         |

---

### ElAConversationPopover Props

| 参数名   | 说明                         | 类型                | 默认值  |
| -------- | ---------------------------- | ------------------- | ------- |
| theme    | 主题风格                     | `'dark' \| 'light'` | —       |
| collapse | 是否收起弹窗（支持 v-model） | `boolean`           | `false` |

### ElAConversationPopover Events

| 事件名          | 说明                               | 回调参数           |
| --------------- | ---------------------------------- | ------------------ |
| update:collapse | 收起状态变更时触发（点击遮罩关闭） | `(value: boolean)` |

### ElAConversationPopover Slots

| 插槽名  | 说明         |
| ------- | ------------ |
| default | 弹窗内容区域 |
