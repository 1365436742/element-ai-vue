# Installation

## Using Package Manager

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

If your network environment is not ideal, it is recommended to use [cnpm](https://github.com/cnpm/cnpm) or [npmmirror](https://npmmirror.com/)

```shell
npm config set registry https://registry.npmmirror.com
```

## On-Demand Import

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

const content = ref(`# Heading 1
## Heading 2
`)
</script>

<template>
  <!--  [!code ++] -->
  <ElAMarkdown :content="content"></ElAMarkdown>
</template>
```

:::

## Internationalization Configuration

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

## Theme Configuration

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
