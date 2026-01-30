# Thinking

Thinking component for displaying collapsible thought processes or detailed content, commonly used in AI conversation scenarios to show model reasoning steps or reference sources. It provides smooth height transition animations and supports custom titles and action buttons. This component can be combined with other components in various ways.

## Basic Usage

:::demo ThinkingBase

```vue
<!-- @include: ../../examples/thinking/base.vue -->
```

:::

::: tip ThoughtChainBase Component
[import ThoughtChainBase from '../thought-chain/base.vue'](/en/base/thought-chain.html#basic-usage)
:::

## Slot Usage

:::demo ThinkingSlot

```vue
<!-- @include: ../../examples/thinking/Slot.vue -->
```

:::

## Props

| Property | Description      | Type      | Default |
| :------- | :--------------- | :-------- | :------ |
| v-model  | Whether expanded | `boolean` | `false` |
| title    | Title            | `string`  | -       |

## Slots

| Slot Name | Description                |
| :-------- | :------------------------- |
| default   | Thinking process content   |
| title     | Custom title content       |
| action    | Custom action area content |
