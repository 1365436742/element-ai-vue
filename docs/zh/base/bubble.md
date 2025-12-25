# Bubble 对话气泡

Bubble 对话气泡组件，用于展示对话消息内容，支持多种样式变体和交互效果。Bubble 组件是构建对话式 AI 交互界面的核心组件之一。它模拟了常见聊天应用中的消息气泡样式，支持文本、Markdown 渲染以及打字机动画效果，让 AI 对话体验更加自然流畅。

## 基础用法

:::demo BubbleBase

```vue
<!-- @include: ../../examples/bubble/base.vue -->
```

:::

## 变体于形状

:::demo BubbleVariantSharp

```vue
<!-- @include: ../../examples/bubble/variant-sharp.vue -->
```

:::

## markdown

:::demo BubbleMarkdown

```vue
<!-- @include: ../../examples/bubble/markdown.vue -->
```

:::

## props

| 属性名     | 说明                                                   | 类型                                                 | 默认值      |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------- | ----------- |
| placement  | 气泡位置                                               | `'start' \| 'end'`                                   | `'start'`   |
| content    | 气泡内容                                               | `string`                                             | `''`        |
| typing     | 是否启用打字机效果                                     | `boolean`                                            | `false`     |
| typingOver | content 内容输出完成标识，置为 true 时打字机会自动完成 | `boolean`                                            | `true`      |
| loading    | 是否显示加载状态                                       | `boolean`                                            | `false`     |
| isMarkdown | 是否渲染 Markdown 内容                                 | `boolean`                                            | `false`     |
| variant    | 气泡变体样式                                           | `'filled' \| 'outlined' \| 'shadow' \| 'borderless'` | `'filled'`  |
| shape      | 气泡形状                                               | `'default' \| 'round' \| 'corner'`                   | `'default'` |

## slots

| 插槽名  | 说明                              |
| ------- | --------------------------------- |
| default | 自定义气泡内容，覆盖 content 属性 |
| avatar  | 自定义头像区域                    |
| header  | 自定义头部区域                    |
| footer  | 自定义底部区域                    |

## exposes

| 方法名          | 说明               | 类型         |
| --------------- | ------------------ | ------------ |
| overTyperwriter | 立即完成打字机效果 | `() => void` |
