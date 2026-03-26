# ConversationMenu

## Basic Usage

:::demo ConversationMenuBase

```vue
<!-- @include: ../../examples/conversation-menu/base.vue -->
```

:::

## Slots

:::demo ConversationMenuSlot

```vue
<!-- @include: ../../examples/conversation-menu/slot.vue -->
```

:::

## Props

| Prop                          | Description                                         | Type                 | Default |
| ----------------------------- | --------------------------------------------------- | -------------------- | ------- |
| items                         | Menu data list                                      | `ConversationMenu[]` | `[]`    |
| keyName                       | Field name used as unique identifier within `items` | `string`             | `'key'` |
| activeKey / v-model:activeKey | The key of the currently active item                | `string`             | `''`    |
| openKeys / v-model:openKeys   | Array of keys for currently expanded submenus       | `string[]`           | `[]`    |
| theme                         | Theme mode                                          | `'dark' \| 'light'`  | —       |

## Events

| Event            | Description                                                        | Callback Parameters                       |
| ---------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| update:activeKey | Emitted when the active item changes, used for `v-model:activeKey` | `(value: string)`                         |
| update:openKeys  | Emitted when expanded items change, used for `v-model:openKeys`    | `(value: string[])`                       |
| activeChange     | Emitted when the user clicks to switch the active item             | `(value: string, item: ConversationMenu)` |

## Slots

| Slot    | Description                                                                         | Slot Props                   |
| ------- | ----------------------------------------------------------------------------------- | ---------------------------- |
| default | Custom content for each menu item, defaults to `TextOverflowTooltip` for label text | `{ item: ConversationMenu }` |

## ConversationMenu Interface

| Field         | Description                                                       | Type                 | Required |
| ------------- | ----------------------------------------------------------------- | -------------------- | -------- |
| key           | Unique identifier, corresponds to `keyName`                       | `string`             | No       |
| label         | Display text                                                      | `string`             | No       |
| disabled      | Whether the item is disabled                                      | `boolean`            | No       |
| children      | Submenu list; when present, the item acts as a collapsible parent | `ConversationMenu[]` | No       |
| [key: string] | Supports any additional fields, accessible via slots              | `any`                | No       |
