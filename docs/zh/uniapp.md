---
title: UniApp
description: 使用 element-ai-vue-uniapp-polyfill 为 uni-app Vue 3.4+ 项目补齐缺失的 Vue API。
---

# UniApp

`element-ai-vue-uniapp-polyfill` 是专门为 **uni-app Vue 3.4+** 项目提供的兼容插件，用于补齐平台 Vue 运行时缺少的 API。目前支持 `useTemplateRef`，可以帮助使用该 API 的组件库在 uni-app 中完成编译和引用绑定。

插件安装在 **Vite 配置**中，同时处理开发环境的依赖预构建和生产构建。无需在 `main.ts` 中调用 `app.use()`，也无需修改组件库的导入方式。

## 适用版本

| 环境            | 要求                      |
| --------------- | ------------------------- |
| uni-app         | 使用 Vue 3 和 Vite 的项目 |
| 平台 Vue 运行时 | 3.4+                      |
| Vite            | 5、6、7                   |
| Node.js         | 20.19+                    |
| TypeScript      | 使用类型声明时需要 5.3+   |

uni-app 会按平台解析自己的 Vue 运行时。项目安装的 `vue` 版本与实际运行时提供的 API 可能不同。例如，组件库使用 `useTemplateRef`，而平台运行时没有导出它时，构建可能出现：

```text
"useTemplateRef" is not exported by ".../vue.runtime.esm.js"
```

本插件保留 uni-app 原有的 Vue 平台别名，为缺失的 API 提供兼容实现。如果运行时已经提供 `useTemplateRef`，则使用原生实现。

## 安装

在 **uni-app 项目**中安装插件：

::: code-group

```sh [npm]
npm install -D element-ai-vue-uniapp-polyfill
```

```sh [pnpm]
pnpm add -D element-ai-vue-uniapp-polyfill
```

```sh [yarn]
yarn add -D element-ai-vue-uniapp-polyfill
```

:::

## 配置 Vite

在 `vite.config.ts` 或 `vite.config.js` 中，将插件放在 `uni()` 后面：

```ts [vite.config.ts]
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import uniappPolyfill from 'element-ai-vue-uniapp-polyfill'

export default defineConfig({
  plugins: [uni(), uniappPolyfill()],
})
```

配置完成后重启开发服务。原有代码可以继续从 `vue` 导入：

```ts
import { useTemplateRef } from 'vue'

const inputRef = useTemplateRef('input')
```

如果项目之前使用过临时的 `useTemplateRefPlugin`，请替换为本插件，避免重复处理。

## 当前提供的 Polyfill

### useTemplateRef

当平台运行时缺少该 API 时，插件提供以下兼容行为：

- 引用初值为 `null`，挂载后接收模板引用，卸载时接收清空值。
- 支持 H5 的字符串 ref 和编译产物中的 ref 对象。
- 为小程序的字符串 ref 补充 `setupState` 绑定，以接收平台回填的引用。
- 处理应用代码、编译后的 Vue 文件及依赖中的具名导入、别名、再导出和命名空间导入。

::: tip 小程序引用
字符串 ref 的 key 应避免与其他 setup 变量冲突。小程序中的 ref 值由平台决定，不应当作浏览器 DOM 使用；`v-for` 字符串 ref 仍受平台渲染器限制。
:::

也可以在业务代码中显式使用运行时入口：

```ts
import { useTemplateRef } from 'element-ai-vue-uniapp-polyfill/runtime'

const inputRef = useTemplateRef('input')
```

这个入口只影响当前导入，依赖内部的 `from 'vue'` 仍需要 Vite 插件处理。

## 可选配置

通常直接使用 `uniappPolyfill()` 即可。若某个依赖需要跳过 Vite 的依赖预构建，可以配置 `excludeDeps`：

```ts [vite.config.ts]
export default defineConfig({
  plugins: [
    uni(),
    uniappPolyfill({
      excludeDeps: ['some-library'],
    }),
  ],
})
```

| 参数          | 类型       | 默认值 | 说明                                          |
| ------------- | ---------- | ------ | --------------------------------------------- |
| `excludeDeps` | `string[]` | `[]`   | 添加到 Vite `optimizeDeps.exclude` 的依赖列表 |

## 直接引入本地 dist

在 Element AI Vue 仓库中执行：

```sh
npm run build:uniapp-polyfill
```

完整的 `npm run build` 也会构建插件。可发布目录为 `dist/element-ai-vue-uniapp-polyfill`，其中包含 `package.json`、README、LICENSE 和 `dist` 构建产物。

如果要复制文件使用，可以将其中的 `dist` 文件夹复制到 uni-app 项目根目录，重命名为 `uniapp-polyfill`，然后安装构建产物需要的依赖：

```sh
npm install -D @babel/parser magic-string
```

修改 Vite 配置中的插件导入路径，其余配置保持一致：

```ts
import uniappPolyfill from './uniapp-polyfill/index.mjs'
```

## 平台支持范围

此插件处理已实现的 Vue API 缺口，不负责把 Web 组件转换为原生小程序组件，也不提供 `document`、`window` 等浏览器环境。

| 平台       | 验证情况                                                            |
| ---------- | ------------------------------------------------------------------- |
| H5         | 已验证 Markdown 示例的开发、生产构建，以及 ref 挂载、卸载和重新绑定 |
| 微信小程序 | 已验证使用兼容 API 的最小示例编译，尚未进行开发者工具或真机验证     |
| App / nvue | 尚未验证                                                            |

当前全量引入 `element-ai-vue` 的微信小程序项目仍可能遇到 `@vueuse/core` 引用 `TransitionGroup` 等平台缺失能力的问题，需要继续做组件级适配。富文本、DOM 布局和浏览器事件等功能也需要按运行平台验证。

本插件不处理 `require('vue')`、动态 `import('vue')`，也不转换可选链等 JavaScript 语法。
