# CodeMermaid 流程图

CodeMermaid 是一个基于 [Mermaid](https://mermaid.js.org/) 的流程图渲染组件，支持动态渲染 Mermaid 图表。

## 基础用法

使用 `content` 属性传入 Mermaid 语法字符串。

:::demo CodeMermaidBase

```vue
<!-- @include: ../../examples/code-mermaid/base.vue -->
```

:::

## 插槽-自定义工具栏

支持插槽定义，自定义工具栏后，工具栏主题需要自己做主题色适配
工具栏有两种

1. 鼠标悬浮工具栏
2. 全屏之后的工具栏

:::demo CodeMermaidSlotExampls

```vue
<!-- @include: ../../examples/code-mermaid/slot-exampls.vue -->
```

:::

::: warning
`theme`、`mermaidConfig` 单独配置的时候所有组件要配置一样的。因为[Mermaid](https://mermaid.js.org/config/schema-docs/config.html)是全局统一渲染的配置，不能单独在渲染的时候配置自己的内容，否则会导致渲染配置不同的情况。除非你是异步渲染，tab切换的类型可以更改。
:::

## props

| 属性名         | 类型            | 必填 | 默认值 | 描述                                                                                                                                                                          |
| :------------- | :-------------- | :--- | :----- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| content        | `string`        | 是   | —      | Mermaid 语法内容                                                                                                                                                              |
| disabledZoom   | `string`        | 否   | []     | `wheel`: 禁止滚轮缩放<br>`fullscreenWheel`: 全屏状态下禁止滚轮缩放<br> `clickMove`: 禁止点击拖拽缩放<br> `fullscreenClickMove`: 全屏状态下禁止点击拖拽缩放<br>`all`: 全部禁止 |
| theme          | `string`        | 否   | `base` | Mermaid 主题，支持 `default`, `forest`, `dark`, `neutral`, `base`                                                                                                             |
| fullscreenMode | `string`        | 否   | `page` | 全屏模式，支持 `web` (网页全屏) 和 `page` (页面全屏)                                                                                                                          |
| mermaidConfig  | `MermaidConfig` | 否   | `{}`   | Mermaid 配置对象，详见 [Mermaid Config](https://mermaid.js.org/config/schema-docs/config.html)                                                                                |

## slot

| 插槽名             | 说明       | 插槽参数                                                                                                                                                                                                                                                                                                                   |
| :----------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fullscreen-toolbar | 全屏工具栏 | `isCodeView`: 当前显示代码(true)、mermaid图表(false)<br>`isCopied`: 表示已经复制，避免它连续复制会有1s的间隔时间让他复制下一次<br>`onCopy`: 复制代码函数<br>`toggleView`: 切换为code、mermaid图表<br>`zoomIn`: 放大<br>`zoomOut`: 缩小<br>`resetZoom`: 恢复默认<br>`toggleFullscreen`: 切换全屏<br>`downloadPng`: 下载图片 |
| toolbar            | 普通工具栏 | 参数同上                                                                                                                                                                                                                                                                                                                   |

## ref

| 方法名           | 说明              | 参数 |
| :--------------- | :---------------- | :--- |
| toggleView       | 切换代码/图表视图 | -    |
| zoomIn           | 放大              | -    |
| zoomOut          | 缩小              | -    |
| resetZoom        | 重置缩放          | -    |
| toggleFullscreen | 切换全屏          | -    |
| downloadPng      | 下载 PNG 图片     | -    |
| onCopy           | 复制代码          | -    |
