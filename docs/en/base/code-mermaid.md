# CodeMermaid Flowchart

CodeMermaid is a flowchart rendering component based on [Mermaid](https://mermaid.js.org/), supporting dynamic rendering of Mermaid diagrams.

## Basic Usage

Use the `content` property to pass in a Mermaid syntax string.

:::demo CodeMermaidBase

```vue
<!-- @include: ../../examples/code-mermaid/base.vue -->
```

:::

## Slot - Custom Toolbar

Supports slot definitions. When customizing the toolbar, you need to handle theme color adaptation yourself.
There are two types of toolbars:

1. Hover toolbar
2. Fullscreen toolbar

:::demo CodeMermaidSlotExampls

```vue
<!-- @include: ../../examples/code-mermaid/slot-exampls.vue -->
```

:::

::: warning
When configuring `theme` and `mermaidConfig` individually, all components must have the same configuration. Because [Mermaid](https://mermaid.js.org/config/schema-docs/config.html) uses globally unified rendering configuration and cannot be configured individually during rendering, otherwise it will cause inconsistent rendering configurations. Unless you are rendering asynchronously, tab switching types can be changed.
:::

## Props

| Property       | Type            | Required | Default | Description                                                                                                                                                                                                                  |
| :------------- | :-------------- | :------- | :------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| content        | `string`        | Yes      | —       | Mermaid syntax content                                                                                                                                                                                                       |
| disabledZoom   | `string`        | No       | []      | `wheel`: Disable wheel zoom<br>`fullscreenWheel`: Disable wheel zoom in fullscreen mode<br> `clickMove`: Disable click drag zoom<br> `fullscreenClickMove`: Disable click drag zoom in fullscreen mode<br>`all`: Disable all |
| theme          | `string`        | No       | `base`  | Mermaid theme, supports `default`, `forest`, `dark`, `neutral`, `base`                                                                                                                                                       |
| fullscreenMode | `string`        | No       | `page`  | Fullscreen mode, supports `web` (web fullscreen) and `page` (page fullscreen)                                                                                                                                                |
| mermaidConfig  | `MermaidConfig` | No       | `{}`    | Mermaid config object, see [Mermaid Config](https://mermaid.js.org/config/schema-docs/config.html)                                                                                                                           |

## Slots

| Slot Name          | Description        | Slot Parameters                                                                                                                                                                                                                                                                                                                                                           |
| :----------------- | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| fullscreen-toolbar | Fullscreen toolbar | `isCodeView`: Currently showing code(true) or mermaid chart(false)<br>`isCopied`: Copy status, 1s interval before next copy<br>`onCopy`: Copy code function<br>`toggleView`: Toggle between code and mermaid chart<br>`zoomIn`: Zoom in<br>`zoomOut`: Zoom out<br>`resetZoom`: Reset to default<br>`toggleFullscreen`: Toggle fullscreen<br>`downloadPng`: Download image |
| toolbar            | Normal toolbar     | Same parameters as above                                                                                                                                                                                                                                                                                                                                                  |

## Ref

| Method Name      | Description            | Parameters |
| :--------------- | :--------------------- | :--------- |
| toggleView       | Toggle code/chart view | -          |
| zoomIn           | Zoom in                | -          |
| zoomOut          | Zoom out               | -          |
| resetZoom        | Reset zoom             | -          |
| toggleFullscreen | Toggle fullscreen      | -          |
| downloadPng      | Download PNG image     | -          |
| onCopy           | Copy code              | -          |
