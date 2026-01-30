# BubbleList

Smart chat scroll container component, designed specifically for conversation scenarios.

## Features

- 📜 **Auto Scroll** - Automatically scrolls to bottom when content increases, ensuring latest messages are visible
- 🔝 **Quick Navigation** - Supports one-click scroll to top, bottom, or specified position
- 🔘 **Smart Indicator** - Automatically shows "Return to Bottom" button when user scrolls up to view history
- 🎨 **Highly Customizable** - Supports custom return button styles and trigger thresholds

## Basic Usage

:::demo BubbleListBase

```vue
<!-- @include: ../../examples/bubble-list/base.vue -->
```

:::

## Custom Advanced Usage

:::demo BubbleListSlot

```vue
<!-- @include: ../../examples/bubble-list/slot.vue -->
```

:::

## Props

| Property        | Description                                               | Type     | Default |
| --------------- | --------------------------------------------------------- | -------- | ------- |
| bottomThreshold | Distance threshold to determine "scrolled to bottom" (px) | `number` | 30      |

## Ref

Access component instance through `ref` to call the following methods:

| Method Name    | Description        | Parameters                         |
| -------------- | ------------------ | ---------------------------------- |
| scrollToBottom | Scroll to bottom   | `(smooth?: string)`                |
| scrollToTop    | Scroll to top      | `(smooth?: string)`                |
| scrollToIndex  | Scroll to position | `(index: number, smooth?: string)` |

## Slots

| Slot Name     | Description                  | Scope Parameters                                 |
| ------------- | ---------------------------- | ------------------------------------------------ |
| default       | List content area            | -                                                |
| bottom-action | Custom back-to-bottom button | `{ scrollToBottom, scrollToTop, scrollToIndex }` |
