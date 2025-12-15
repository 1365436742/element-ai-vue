# CodeHighlight 代码高亮

CodeHighlight 是一个基于 [Shiki](https://shiki.tmrs.site/) 的代码高亮组件，是一个基于 TextMate 语法和主题的美观且强大的语法高亮工具，使用与 VS Code 相同的语法高亮引擎。它能为几乎所有主流编程语言提供非常精准且快速的语法高亮。

## 核心特性

- **基于 Shiki**: 使用 Shiki 作为底层高亮引擎，支持 TextMate 语法，生成的 HTML 与 VS Code 几乎一致。
- **高性能**: 优化的加载策略，支持按需加载语言和主题。

## 基础用法

使用 `content` 属性传入代码字符串，`language` 属性指定编程语言。

:::demo CodeHighlightBase

```vue
<template>
  <ElACodeHighlight language="javascript" :content="content"></ElACodeHighlight>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElACodeHighlight } from 'element-ai-vue'

const content = ref(`/**
 * 生成指定区间 [min, max] 的随机整数（包含 min 和 max）
 * @param {number} min - 最小值（整数）
 * @param {number} max - 最大值（整数）
 * @returns {number} 随机整数
 */
function getRandomInt(min, max) {
  // 先取整避免非整数参数问题，再计算区间
  min = Math.ceil(min);
  max = Math.floor(max);
  // Math.random() 生成 [0,1)，计算后得到 [min, max]
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 示例：生成 1 到 10 之间的随机整数（包含1和10）
console.log(getRandomInt(1, 10)); // 输出：1~10 之间的随机数`)
</script>
```

:::

## 插槽-自定义头部

支持插槽定义，自定义头部后，头部主题需要自己做主题色适配

:::demo CodeHighlightSlotExampls

```vue
<template>
  <ElACodeHighlight language="javascript" :content="content">
    <template #header="{ content, language, isCopied, onCopy }">
      <div class="header">
        <div>{{ language }}</div>
        <button @click="onCopy">{{ isCopied ? '已复制' : '复制' }}</button>
      </div>
    </template>
  </ElACodeHighlight>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElACodeHighlight } from 'element-ai-vue'

const content = ref(`/**
 * 生成指定区间 [min, max] 的随机整数（包含 min 和 max）
 * @param {number} min - 最小值（整数）
 * @param {number} max - 最大值（整数）
 * @returns {number} 随机整数
 */
function getRandomInt(min, max) {
  // 先取整避免非整数参数问题，再计算区间
  min = Math.ceil(min);
  max = Math.floor(max);
  // Math.random() 生成 [0,1)，计算后得到 [min, max]
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 示例：生成 1 到 10 之间的随机整数（包含1和10）
console.log(getRandomInt(1, 10)); // 输出：1~10 之间的随机数`)
</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #000;
  padding: 8px;
  color: #fff;
}
</style>
```

:::

::: tip
默认支持,language: `javascript`, `typescript`, `vue`, `html`, `css`,`json`, `bash`, `shell`, `yaml`, `markdown`,`python`, `java`, `go`, `sql`, `rust`
:::

## props

| 属性名          | 类型                | 必填 | 默认值         | 描述                                                                          |
| :-------------- | :------------------ | :--- | :------------- | :---------------------------------------------------------------------------- |
| content         | `string`            | 是   | —              | 需要高亮的代码内容                                                            |
| language        | `string`            | 否   | —              | 代码语言                                                                      |
| theme           | `string`            | 否   | `github-light` | 高亮主题，默认支持 `github-light`, `github-dark`                              |
| extendLanguages | `BundledLanguage[]` | 否   | `[]`           | 需要额外加载的语言列表，详见 [Shiki Languages](https://shiki.style/languages) |
| extendThemes    | `BundledTheme[]`    | 否   | `[]`           | 需要额外加载的主题列表，详见 [Shiki Themes](https://shiki.style/themes)       |

## slot

| 插槽名 | 说明           | 插槽参数                                                                                                                                    |
| :----- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| header | 自定义头部内容 | `content`: 代码内容<br>`language`: 语言<br>`isCopied`: 表示已经复制，避免它连续复制会有1s的间隔时间让他复制下一次<br>`onCopy`: 复制代码函数 |
