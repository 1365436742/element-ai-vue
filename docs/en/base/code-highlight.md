# CodeHighlight

CodeHighlight is a code highlighting component based on [Shiki](https://shiki.tmrs.site/), a beautiful and powerful syntax highlighter built on TextMate grammar and themes. It uses the same syntax highlighting engine as VS Code, providing precise and fast syntax highlighting for almost all major programming languages.

## Core Features

- **Based on Shiki**: Uses Shiki as the underlying highlighting engine, supporting TextMate grammar. The generated HTML is nearly identical to VS Code.
- **High Performance**: Optimized loading strategy, supporting on-demand loading of languages and themes.

## Basic Usage

Use the `content` property to pass in a code string, and the `language` property to specify the programming language.

:::demo CodeHighlightBase

```vue
<!-- @include: ../../examples/code-highlight/base.vue -->
```

:::

## Slot - Custom Header

Supports slot definitions. When customizing the header, you need to handle theme color adaptation yourself.

:::demo CodeHighlightSlotExampls

```vue
<!-- @include: ../../examples/code-highlight/slot-exampls.vue -->
```

:::

## Individual Theme Configuration

:::demo CodeHighlightDark

```vue
<!-- @include: ../../examples/code-highlight/dark.vue -->
```

:::

::: tip
Default supported languages: `javascript`, `typescript`, `vue`, `html`, `css`, `json`, `bash`, `shell`, `yaml`, `markdown`, `python`, `java`, `go`, `sql`, `rust`, `mermaid`
:::

## Props

| Property        | Type                | Required | Default | Description                                                                        |
| :-------------- | :------------------ | :------- | :------ | :--------------------------------------------------------------------------------- |
| content         | `string`            | Yes      | —       | Code content to highlight                                                          |
| language        | `string`            | No       | —       | Code language                                                                      |
| theme           | `string`            | No       | `light` | Highlight theme, defaults support `light`, `dark`                                  |
| extendLanguages | `BundledLanguage[]` | No       | `[]`    | Additional languages to load, see [Shiki Languages](https://shiki.style/languages) |
| extendThemes    | `BundledTheme[]`    | No       | `[]`    | Additional themes to load, see [Shiki Themes](https://shiki.style/themes)          |

## Slots

| Slot Name | Description           | Slot Parameters                                                                                                                                                         |
| :-------- | :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| header    | Custom header content | `content`: Code content<br>`language`: Language<br>`isCopied`: Copy status, 1s interval before next copy<br>`onCopy`: Copy code function<br>`toggleExpanded`: Fold code |

## Ref

| Method Name    | Description | Parameters |
| :------------- | :---------- | :--------- |
| onCopy         | Copy code   | -          |
| toggleExpanded | Fold code   | -          |
