# Thinking 思考

Thinking 组件用于展示可折叠的思考过程或详细内容，常用于 AI 对话场景中展示模型的推理步骤或引用来源。它提供了平滑的高度过渡动画，并支持自定义标题和操作按钮。本组件内容可以和其他组件多种组合显示。

## 基础用法

:::demo ThinkingBase

```vue
<!-- @include: ../../examples/thinking/base.vue -->
```

:::

::: tip ThoughtChainBase组件
[import ThoughtChainBase from '../thought-chain/base.vue'](/zh/base/thought-chain.html#基础用法)
:::

## 插槽用法

:::demo ThinkingSlot

```vue
<!-- @include: ../../examples/thinking/Slot.vue -->
```

:::

## props

| 属性名  | 说明     | 类型      | 默认值  |
| :------ | :------- | :-------- | :------ |
| v-model | 是否展开 | `boolean` | `false` |
| title   | 标题     | `string`  | -       |

## slots

| 插槽名  | 说明               |
| :------ | :----------------- |
| default | 思考过程的内容     |
| title   | 自定义标题内容     |
| action  | 自定义操作区域内容 |
