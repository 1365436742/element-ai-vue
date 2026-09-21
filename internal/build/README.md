# 构建工具与兼容性验证

开发环境使用 Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`、pnpm 10.18.2，
CI 使用 Node 24。Vitest 5 和 tsdown 0.23 不再支持 Node 20。
这只是仓库构建环境要求；发布包的入口、依赖、Vue peer 范围和 ES2018
编译目标保持不变。

- Gulp 5 编排构建，字体与资源复制显式使用 `encoding: false`。
- 主库使用 Rolldown 1.2，Vue SFC 使用 `unplugin-vue/rolldown`。
  解析、CommonJS、TypeScript 转译、环境常量替换和压缩使用 Rolldown 内建能力。
- 内部工具使用 tsdown 0.23，替换基于 Rollup 的 unbuild，声明由 TypeScript 7 生成。
  `pnpm stub` 现在按 workspace 依赖顺序编译内部工具；修改内部工具后需重新执行。
- 文档使用 VitePress 2.0.0-alpha.20 / Vite 8。
- 单元测试使用 Vitest 5.0.1 / `@vitest/coverage-v8` 5.0.1。
  覆盖率统计组件和工具源码；Node 内置测试运行器的用例继续单独执行。
- 根目录和 uni-app 子包使用 TypeScript 7.0.2，构建时不临时下载编译器。

`@sass/types` 与 Sass 对齐，避免 gulp-sass 的编译器类型不匹配。

## TypeScript 7 与 Vue

TypeScript 7 尚未提供稳定的旧 JavaScript 编译器 API，vue-tsc 3.3.11 和
Vue SFC 的导入类型解析仍依赖该 API。根据
[TypeScript 官方迁移说明](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)，
私有 workspace `internal/vue-types` 将 `typescript` 别名指向官方
`@typescript/typescript6` 兼容包（锁定的后端为 TypeScript 6.0.3）。
根目录的 `pnpm exec tsc --version` 仍为 7.0.2。

`pnpm typecheck` 依次检查构建脚本、Vue/文档、Vitest 配置和 uni-app 子包。
Rolldown、VitePress 和 Vitest 通过 `internal/vue-types/compiler.ts` 为 Vue
注册 TS6 API；兼容性校验脚本的 AST 检查也使用该兼容包。这些都是开发依赖。

TS 配置移除了 `baseUrl` 和 `moduleResolution: node`，路径别名使用显式相对路径，
切换为 `bundler` 解析；通过 `vite/client` 声明处理样式导入。uni-app 显式设置
`rootDir: src`，避免 TS7 的新默认值改变声明输出目录。过时的 Vitest workspace
文件和不存在的 include 路径已移除。

`tsconfig.build.json` 专用于 Vue 声明生成，在现代模块解析下关闭 package.json
的 exports/imports 映射，以保留历史 `element-ai-vue/es/utils`、`es/hooks` 等
类型引用路径。普通类型检查仍使用默认的 exports/imports 解析。

## 保留发布路径

`src/legacy-entry-names.json` 记录迁移前同目录 `index.ts` / `index.vue`
重名时的实际文件名。同名文件在不同组件中曾采用不同的 `index` / `index2`
顺序，因此必须保留该映射，不能仅依赖新打包器自动命名。

全量包先生成 ESM 中间结果，再输出 UMD / ESM。这个步骤让 Vue 的通配重导出
变成明确的 namespace import，避免 UMD 浏览器工厂中残留 `require('vue')`。
中间结果的 source map 会传递到最终输出。

旧 Vue 辅助模块和空 source map 路径也保留。Rolldown 为 CommonJS 增加的
内部 runtime helper 是新增文件，不替换旧路径。

锁文件里仍可能出现 Rollup：旧版 Vite 兼容性测试、demoblock 的
间接依赖或 unplugin 的可选 peer 会引用它。主库和内部工具不再用 Rollup 打包。

## 验证

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test:build
pnpm docs:build
pnpm test:coverage
pnpm test:uniapp-polyfill
pnpm typecheck
```

迁移前先把一次完整构建的 `dist/element-ai-vue` 保存到独立目录，例如
`/tmp/element-ai-before`。在相同源码、版本号和运行时依赖下完成新构建，再运行：

```sh
pnpm test:build /tmp/element-ai-before
```

检查包括：所有旧文件仍存在、每个 ESM 模块导出及源文件对应关系、发布清单、
类型声明、字体和资源内容、CSS 规则、相对导入和 source map、语言包内容，
以及 UMD 的浏览器全局 / CommonJS / AMD 模式。还会在 DOM 环境中挂载组件，
验证点击交互和 `v-model` 事件，并比较新旧渲染结果。

JavaScript 文本、压缩方式和 CSS 的选择器合并方式可以不同；消费者可用的
入口、导出和运行行为必须保持兼容。

## 本次迁移验证记录

- 升级前保存完整产物；931 个旧文件全部保留，另增加 CommonJS runtime helper
  及其 source map 两个内部文件。291 个声明文件、字体和资源内容一致，CSS
  规则一致，全部 ESM 子模块的导出和源文件路径对应一致。
- Node 24.14.0 构建及兼容检查通过，文档构建和全部类型检查通过。
  Node 24 本机完整构建从约 29 秒降至约 6–7 秒，不包括安装和兼容检查。
- 将新旧 tarball 安装到独立 npm 项目后，ESM / CommonJS 导入、CSS 路径解析、
  两种模块模式的 TypeScript 消费检查，以及 6 个组件的 SSR 对比通过。
- Vitest 5 的 8 个测试及 V8 覆盖率生成通过，16 个 uni-app polyfill 测试通过。
  uni-app 的 4 个声明文件经 TS7 生成后仅 import attribute 换行不同，语法 token
  完全一致，ESM / CommonJS 消费类型检查通过。
- 发布测试存在 3 个原有失败：`scripts/publish.ts` 已注释 uni-app 子包的发布，
  测试仍期待两个包都递增和发布。本次没有修改发布范围。
