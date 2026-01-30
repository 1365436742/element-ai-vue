# 安装

## 使用包管理器

::: code-group

```sh [npm]
$ npm install element-ai-vue
```

```sh [pnpm]
$ pnpm install element-ai-vue
```

```sh [yarn]
$ yarn add element-ai-vue
```

:::

如果你的网络环境不佳，推荐使用 [cnpm](https://github.com/cnpm/cnpm) 或使用 [npmmirror](https://npmmirror.com/)

```shell
npm config set registry https://registry.npmmirror.com
```

## 按需引入

::: code-group

```ts [main.ts]  {3}
import { createApp } from 'vue'
import App from './App.vue'
import 'element-ai-vue/dist/index.css' // [!code ++]

const app = createApp(App)
```

```vue [App.vue] {3,11}
<script setup lang="ts">
import { ref } from 'vue'
import { ElAMarkdown } from 'element-ai-vue' // [!code ++]

const content = ref(`# 一级标题
## 二级标题
`)
</script>

<template>
  <!--  [!code ++] -->
  <ElAMarkdown :content="content"></ElAMarkdown>
</template>
```

:::

## 国际化配置

::: code-group

```vue [App.vue]
<script setup lang="ts">
import { ref } from 'vue'
import { ElAConfigProvider } from 'element-ai-vue' // [!code ++]
import en from 'element-ai-vue/es/locale/lang/en' // [!code ++]
// import zhCn from "element-ai-vue/es/locale/lang/zh-cn";
</script>

<template>
  <!--  [!code ++] -->
  <ElAConfigProvider :locale="en">
    <App />
    <!--  [!code ++] -->
  </ElAConfigProvider>
</template>
```

:::

## 主题色配置

::: code-group

```vue [App.vue]
<script setup lang="ts">
import { ref } from 'vue'
import { ElAConfigProvider } from 'element-ai-vue' // [!code ++]
</script>

<template>
  <!--  [!code ++] -->
  <ElAConfigProvider theme="dark">
    <App />
    <!--  [!code ++] -->
  </ElAConfigProvider>
</template>
```

:::
