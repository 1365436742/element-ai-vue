# ConversationCreate

## Basic Usage

:::demo ConversationCreateBase

```vue
<!-- @include: ../../examples/conversation-create/base.vue -->
```

:::

## Props

| Prop         | Description                                                                                                  | Type                | Default |
| ------------ | ------------------------------------------------------------------------------------------------------------ | ------------------- | ------- |
| shortcutKeys | Keyboard shortcut(s) to trigger new conversation creation, see [usemagickeys](https://vueuse.org/core/useMagicKeys/#usemagickeys) | `string[]` | `[]`   |
| theme        | Theme mode                                                                                                   | `'dark' \| 'light'` | —       |

## Events

| Event                   | Description                                          | Callback Parameters |
| ----------------------- | ---------------------------------------------------- | ------------------- |
| conversationCreateClick | Emitted when the button is clicked or shortcut is triggered | —              |

## Slots

| Slot    | Description                                                        |
| ------- | ------------------------------------------------------------------ |
| default | Custom text content in the middle of the button, defaults to "新对话" |
| icon    | Custom left icon area, defaults to a plus icon                     |
| end     | Custom right area, defaults to shortcut key hint (⌘K)             |
