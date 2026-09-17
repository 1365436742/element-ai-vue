---
title: UniApp
description: Fill missing Vue APIs in uni-app Vue 3.4+ projects with element-ai-vue-uniapp-polyfill.
---

# UniApp

`element-ai-vue-uniapp-polyfill` is a compatibility plugin for **uni-app projects using Vue 3.4+**. It fills gaps in the platform Vue runtime. The current polyfill supports `useTemplateRef`, allowing libraries that use this API to compile and bind template refs in uni-app.

Install the plugin in your **Vite configuration**. It handles dependency pre-bundling during development and production builds. No `app.use()` call in `main.ts` or changes to component library imports are required.

## Requirements

| Environment          | Requirement                           |
| -------------------- | ------------------------------------- |
| uni-app              | A project using Vue 3 and Vite        |
| Platform Vue runtime | 3.4+                                  |
| Vite                 | 5, 6 or 7                             |
| Node.js              | 20.19+                                |
| TypeScript           | 5.3+ when using the type declarations |

uni-app resolves a platform-specific Vue runtime. The installed `vue` version may differ from the APIs available in that runtime. If a library uses `useTemplateRef` but the runtime does not export it, a build may fail with:

```text
"useTemplateRef" is not exported by ".../vue.runtime.esm.js"
```

This plugin preserves uni-app's Vue aliases and supplies the missing API. When the runtime already provides `useTemplateRef`, its native implementation is used.

## Installation

Install the plugin in your **uni-app project**:

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

## Configure Vite

Add the plugin after `uni()` in `vite.config.ts` or `vite.config.js`:

```ts [vite.config.ts]
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import uniappPolyfill from 'element-ai-vue-uniapp-polyfill'

export default defineConfig({
  plugins: [uni(), uniappPolyfill()],
})
```

Restart your development server after changing the configuration. Existing code can keep importing from `vue`:

```ts
import { useTemplateRef } from 'vue'

const inputRef = useTemplateRef('input')
```

If your project already uses a temporary `useTemplateRefPlugin`, replace it with this plugin to avoid processing modules twice.

## Available Polyfill

### useTemplateRef

When the platform runtime does not provide this API, the fallback supports:

- A `null` initial value, reference assignment on mount, and clearing on unmount.
- H5 string refs and ref objects in compiled templates.
- A `setupState` binding for mini-program string refs to receive platform reference updates.
- Named imports, aliases, re-exports and namespace imports in application code, compiled Vue files and dependencies.

::: tip Mini-program refs
Avoid string ref keys that conflict with other setup variables. Ref values depend on the platform and should not be treated as browser DOM nodes. String refs inside `v-for` remain subject to platform renderer limitations.
:::

You can also explicitly import the helper from the runtime entry:

```ts
import { useTemplateRef } from 'element-ai-vue-uniapp-polyfill/runtime'

const inputRef = useTemplateRef('input')
```

This entry only affects the current import. Imports from `vue` inside dependencies still need the Vite plugin.

## Options

For most projects, `uniappPolyfill()` is sufficient. If a dependency needs to bypass Vite dependency pre-bundling, configure `excludeDeps`:

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

| Option        | Type       | Default | Description                                          |
| ------------- | ---------- | ------- | ---------------------------------------------------- |
| `excludeDeps` | `string[]` | `[]`    | Dependencies to add to Vite's `optimizeDeps.exclude` |

## Import a Local Build

Run this command in the Element AI Vue repository:

```sh
npm run build:uniapp-polyfill
```

The full `npm run build` command also builds the plugin. The publish directory is `dist/element-ai-vue-uniapp-polyfill`, containing `package.json`, README, LICENSE and the compiled `dist` files.

To use copied files, copy its `dist` folder to the root of your uni-app project, rename it to `uniapp-polyfill`, and install the dependencies required by the build:

```sh
npm install -D @babel/parser magic-string
```

Change the plugin import in your Vite configuration; keep the rest of the configuration the same:

```ts
import uniappPolyfill from './uniapp-polyfill/index.mjs'
```

## Platform Support

This plugin fills the implemented Vue API gaps. It does not convert Web components to native mini-program components or provide browser globals such as `document` and `window`.

| Platform            | Verification                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| H5                  | Markdown example verified in development and production builds; ref mounting, clearing and rebinding verified       |
| Weixin mini-program | A minimal example using the compatibility API compiles; developer tools and device execution have not been verified |
| App / nvue          | Not yet verified                                                                                                    |

Importing the full `element-ai-vue` library in a Weixin mini-program can still encounter missing platform features, such as `TransitionGroup` referenced by `@vueuse/core`. These require component-level adaptation. Rich text, DOM layout and browser event features also need platform-specific verification.

The plugin does not handle `require('vue')`, dynamic `import('vue')`, or JavaScript syntax transforms such as optional chaining.
