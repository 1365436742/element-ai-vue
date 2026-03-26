# Conversations

## Basic Usage

:::demo ConversationsBase

```vue
<!-- @include: ../../examples/conversations/base.vue -->
```

:::

## Load More

:::demo ConversationsLoadMore

```vue
<!-- @include: ../../examples/conversations/loadMore.vue -->
```

:::

:::details ./mock.ts file

::: code-group

<<< ../../examples/conversations/mock.ts

:::

## Collapse & Mobile Support

:::demo ConversationsMobile

```vue
<!-- @include: ../../examples/conversations/mobile.vue -->
```

:::

### ElAConversations Props

| Prop    | Description                                         | Type                  | Default |
| ------- | --------------------------------------------------- | --------------------- | ------- |
| theme   | Theme style                                         | `'dark' \| 'light'`   | —       |
| hasMore | Whether there is more data to load                  | `boolean`             | `false` |
| onNext  | Callback to load more data, should return a Promise | `() => Promise<void>` | —       |

### ElAConversations Slots

| Slot    | Description            |
| ------- | ---------------------- |
| header  | Top area               |
| scroll  | Scrollable list area   |
| loading | Custom loading content |
| footer  | Bottom area            |

---

### ElAConversationPopover Props

| Prop     | Description                                | Type                | Default |
| -------- | ------------------------------------------ | ------------------- | ------- |
| theme    | Theme style                                | `'dark' \| 'light'` | —       |
| collapse | Whether the popover is collapsed (v-model) | `boolean`           | `false` |

### ElAConversationPopover Events

| Event           | Description                                                 | Callback           |
| --------------- | ----------------------------------------------------------- | ------------------ |
| update:collapse | Triggered when collapse state changes (click mask to close) | `(value: boolean)` |

### ElAConversationPopover Slots

| Slot    | Description          |
| ------- | -------------------- |
| default | Popover content area |
