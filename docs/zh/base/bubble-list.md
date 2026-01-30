# BubbleList 气泡列表

智能聊天滚动容器组件，专为对话场景设计。

## 功能特性

- 📜 **自动滚动** - 内容增加时自动滚动到底部，确保最新消息可见
- 🔝 **快捷导航** - 支持一键滚动到顶部、底部或指定位置
- 🔘 **智能提示** - 用户向上滚动查看历史消息时，自动显示"返回底部"按钮
- 🎨 **高度定制** - 支持自定义返回按钮样式和触发阈值

## 基础用法

:::demo BubbleListBase

```vue
<!-- @include: ../../examples/bubble-list/base.vue -->
```

:::

## 自定义高级用法

:::demo BubbleListSlot

```vue
<!-- @include: ../../examples/bubble-list/slot.vue -->
```

:::

## props

| 属性名          | 说明                                 | 类型     | 默认值 |
| --------------- | ------------------------------------ | -------- | ------ |
| bottomThreshold | 判定为"已滚动到底部"的距离阈值（px） | `number` | 30     |

## ref

通过 `ref` 可以获取到组件实例并调用以下方法：

| 方法名         | 说明           | 参数                               |
| -------------- | -------------- | ---------------------------------- |
| scrollToBottom | 滚动到底部     | `(smooth?: string)`                |
| scrollToTop    | 滚动到顶部     | `(smooth?: string)`                |
| scrollToIndex  | 滚动到指定位置 | `(index: number, smooth?: string)` |

## slot

| 插槽名        | 说明               | 作用域参数                                       |
| ------------- | ------------------ | ------------------------------------------------ |
| default       | 列表内容区域       | -                                                |
| bottom-action | 自定义返回底部按钮 | `{ scrollToBottom, scrollToTop, scrollToIndex }` |
