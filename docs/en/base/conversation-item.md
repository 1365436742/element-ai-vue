# ConversationItem

## Basic Usage

:::demo ConversationItemBase

```vue
<!-- @include: ../../examples/conversation-item/base.vue -->
```

:::

## Slots

:::demo ConversationItemSlot

```vue
<!-- @include: ../../examples/conversation-item/slot.vue -->
```

:::

## Grouping & Sticky Header

:::demo ConversationItemSticky

```vue
<!-- @include: ../../examples/conversation-item/sticky.vue -->
```

:::

## Props

| Prop                          | Description                                         | Type                 | Default |
| ----------------------------- | --------------------------------------------------- | -------------------- | ------- |
| items                         | List of conversation items                          | `ConversationItem[]` | `[]`    |
| keyName                       | Field name used as unique identifier within `items` | `string`             | `'key'` |
| activeKey / v-model:activeKey | The key of the currently active item                | `string`             | `''`    |
| sticky                        | Whether to enable sticky group title headers        | `boolean`            | `false` |
| theme                         | Theme mode                                          | `'dark' \| 'light'`  | —       |

## Events

| Event            | Description                                                                        | Callback Parameters                       |
| ---------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| update:activeKey | Emitted when the active item changes, used for `v-model:activeKey` two-way binding | `(value: string)`                         |
| activeChange     | Emitted when the user clicks to switch the active item                             | `(value: string, item: ConversationItem)` |

## Slots

| Slot  | Description                       | Slot Props                   |
| ----- | --------------------------------- | ---------------------------- |
| item  | Custom content for each list item | `{ item: ConversationItem }` |
| group | Custom content for group title    | `{ groupName: string }`      |

## ConversationItem Interface

| Field         | Description                                                | Type      | Required |
| ------------- | ---------------------------------------------------------- | --------- | -------- |
| key           | Unique identifier, corresponds to `keyName`                | `string`  | No       |
| label         | Display text                                               | `string`  | No       |
| group         | Group name; items with the same value are grouped together | `string`  | No       |
| disabled      | Whether the item is disabled                               | `boolean` | No       |
| [key: string] | Supports any additional fields, accessible via slots       | `any`     | No       |
