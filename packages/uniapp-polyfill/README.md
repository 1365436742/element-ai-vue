# element-ai-vue-uniapp-polyfill

为 uni-app Vue 3 项目补齐组件库需要、但平台 Vue 运行时尚未提供的 API。
这是 **Vite 插件**，放在 `vite.config` 中使用，不需要 `app.use()`。

目前提供 `useTemplateRef` 兼容，针对 `element-ai-vue` 在 uni-app Vue 3.4 运行时中出现的
`"useTemplateRef" is not exported by ".../vue.runtime.esm.js"` 错误。

## 安装与使用

```bash
pnpm add -D element-ai-vue-uniapp-polyfill
```

```ts
// vite.config.ts / vite.config.js
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import uniappPolyfill from 'element-ai-vue-uniapp-polyfill'

export default defineConfig({
  plugins: [uni(), uniappPolyfill()],
})
```

已有临时 `useTemplateRefPlugin` 的项目，使用本插件替换它即可。原有组件库导入无需修改。
插件同时提供具名导出 `uniappPolyfill`，支持 ESM 和 CommonJS 配置文件。

## 兼容范围

- 改写应用代码、编译后的 Vue SFC 和依赖中的 `useTemplateRef` 具名导入、别名与再导出。
- 支持 `import * as Vue`、命名空间解构、计算属性访问及 `export *`；不修改字符串、注释或同名局部变量。
- 保留 uni-app 对 `vue` 的平台别名，其他 Vue API 继续来自原运行时。
- 同时处理 Vite 构建阶段和 esbuild 依赖预构建；无需把所有依赖排除出预构建。
- Vue 3.5 及更新运行时已有 `useTemplateRef` 时，使用原生实现。
- Vue 3.4 回退初值为 `null`，支持 H5 字符串 ref、编译产物 ref 对象和卸载回填；小程序字符串 ref 在挂载前接入 `setupState`。
- 包含 Source Map 和 TypeScript 声明。支持 Vite 5–7、Vue 3.4+，构建工具需要 Node.js 20.19+。

本包只处理已实现的 Vue API 缺口，不是完整的跨端组件转换器。`document`、`window`、DOM 布局、
富文本编辑器、SVG、浏览器事件等依赖仍需组件级适配；编译成功不代表这些组件可在小程序或 nvue 中运行。
本包也不转换可选链等 JavaScript 语法，不处理 `require('vue')` 或动态 `import('vue')`。

小程序的字符串 ref 请使用不与其他 setup 变量冲突的 key；Vue 3.4 回退返回值在类型上只读，
运行时保留可写以兼容旧渲染器。小程序 `v-for` 字符串 ref 仍受平台渲染器限制，不在本包的兼容承诺内。

## 可选配置

```ts
uniappPolyfill({
  // 默认 []；仅在个别依赖需要绕过 Vite 预构建时设置。
  excludeDeps: ['some-library'],
})
```

如果应用代码需要直接使用兼容函数，也可以从独立运行时入口导入：

```ts
import { useTemplateRef } from 'element-ai-vue-uniapp-polyfill/runtime'

const input = useTemplateRef<HTMLInputElement>('input')
```

直接导入仅影响该调用，依赖内部的 `from 'vue'` 仍需安装 Vite 插件。

## 本仓库开发与发布

```bash
# 仓库根目录：构建主库与插件的独立发布目录
npm run build

# 只构建插件 / 回归测试
npm run build:uniapp-polyfill
npm run test:uniapp-polyfill

# 进入根目录 dist 下的插件发布目录
cd dist/element-ai-vue-uniapp-polyfill

# 可选：生成 tgz，存到根目录 dist
npm pack --pack-destination ..

# 发布独立包；版本从源码 packages/uniapp-polyfill/package.json 读取
npm publish
```

`npm run build` 和 `npm run build:uniapp-polyfill` 都会生成完整发布目录：

```text
dist/
├── element-ai-vue/                  主组件库产物（完整构建时生成）
└── element-ai-vue-uniapp-polyfill/   插件独立发布目录
    ├── package.json
    ├── README.md
    ├── LICENSE
    └── dist/
        ├── index.mjs / index.cjs
        ├── index.d.ts / index.d.cts
        ├── runtime.mjs / runtime.cjs
        ├── runtime.d.ts / runtime.d.cts
        └── *.map
```

发布目录保留正式依赖、peerDependencies 和入口声明，去掉仅供源码开发使用的 scripts、devDependencies，
可以直接在该目录执行 `npm pack` / `npm publish`，无需再次编译，也不依赖仓库的构建脚本。
主库和插件各自有独立的 package.json，不会打成同一个 npm 包。

同时保留 `packages/uniapp-polyfill/dist`，已有本地导入路径仍然有效：

```text
index.mjs / index.cjs          Vite 插件（内嵌运行时源码）
index.d.ts / index.d.cts        插件类型
runtime.mjs / runtime.cjs      可单独导入的 Vue 兼容函数
runtime.d.ts / runtime.d.cts    运行时类型
*.map                         Source Map
```

发布白名单仅包含 `dist`、README、LICENSE，不依赖仓库的 `src`、workspace 包或本机路径。
如果在源码目录 `packages/uniapp-polyfill` 执行 `pnpm pack`，`prepack` 仍会重新构建。
原仓库的交互式 `pnpm publish` 脚本仍用于主组件库；本包按上面的独立命令发布。

## 后续添加兼容项

在 `src/runtime.ts` 添加运行时兼容函数，在 `src/transform.ts` 中增加需要重定向的 API 名称，
并在 `tests` 中覆盖导入、缺失运行时与预构建行为。`scripts/build.mjs` 自动把运行时代码嵌入插件。

## 集成验证记录

使用现有测试项目的副本验证，未改写原项目。测试环境为 uni-app
`3.0.0-5020420260813003`、Vite `5.2.8`，平台 Vue 运行时 `3.4.21`：

- 原 Markdown 示例 H5 生产构建通过；H5 开发页面正常显示，未捕获到浏览器 error/warn。
- 增加临时 `useTemplateRef` 交互示例，实际验证了挂载绑定、卸载清空、重新挂载绑定。
- 仅使用兼容 API 的最小微信小程序示例编译通过；未进行微信开发者工具或真机运行验证。
- 原 Markdown 示例全量引入 `element-ai-vue` 的微信小程序构建仍失败：`@vueuse/core` 经 `vue-demi`
  引用平台缺少的 `TransitionGroup`。这属于后续组件级跨端适配范围，不能据此宣称主组件库已完整支持小程序。
- App / nvue 尚未验证。TypeScript 声明的 ESM / CommonJS 双入口需要 TypeScript 5.3+。

参考：[Vue useTemplateRef](https://vuejs.org/api/composition-api-helpers.html#usetemplateref)、
[Vite 5 依赖预构建配置](https://v5.vite.dev/config/dep-optimization-options)。
