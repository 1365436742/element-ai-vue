import { readFile } from 'node:fs/promises'
import { dirname, extname } from 'node:path'
import type { DepOptimizationOptions, Plugin } from 'vite' with {
  'resolution-mode': 'import',
}
import { RESOLVED_ID, VIRTUAL_ID, transformVueImports } from './transform'

declare const __UNIAPP_POLYFILL_RUNTIME__: string
type EsbuildPlugin = NonNullable<
  NonNullable<DepOptimizationOptions['esbuildOptions']>['plugins']
>[number]

export interface UniappPolyfillOptions {
  /** Additional dependencies to keep out of Vite's pre-bundling. */
  excludeDeps?: string[]
}

// The build embeds the runtime, so installed plugins do not depend on src files.
const source = `${__UNIAPP_POLYFILL_RUNTIME__}\nexport * from 'vue';\n`

function optimizerPlugin(root: string): EsbuildPlugin {
  return {
    name: 'element-ai-vue:uniapp-polyfill:optimizer',
    setup(build) {
      build.onResolve(
        { filter: /^virtual:element-ai-vue\/uniapp-polyfill\/vue$/ },
        () => ({
          path: VIRTUAL_ID,
          namespace: 'uniapp-polyfill',
        })
      )
      build.onLoad({ filter: /.*/, namespace: 'uniapp-polyfill' }, () => ({
        contents: source,
        loader: 'js',
        resolveDir: root,
      }))
      build.onLoad(
        { filter: /\.[cm]?[jt]sx?$/, namespace: 'file' },
        async ({ path }) => {
          const code = await readFile(path, 'utf8')
          const result = transformVueImports(code, path)
          if (!result) return
          const extension = extname(path).slice(1)
          const loader =
            extension === 'tsx' || extension === 'jsx'
              ? extension
              : /[cm]?ts/.test(extension)
                ? 'ts'
                : 'js'
          return {
            contents: `${result.code}\n//# sourceMappingURL=${result.map.toUrl()}`,
            loader,
            resolveDir: dirname(path),
          }
        }
      )
    },
  }
}

/** Install after uni() in vite.config; no app.use() call is needed. */
export function uniappPolyfill(options: UniappPolyfillOptions = {}): Plugin {
  return {
    name: 'element-ai-vue:uniapp-polyfill',
    enforce: 'post',
    config(config) {
      return {
        optimizeDeps: {
          exclude: options.excludeDeps ?? [],
          esbuildOptions: {
            plugins: [optimizerPlugin(config.root ?? process.cwd())],
          },
        },
      }
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id === RESOLVED_ID) return source
    },
    transform(code, id) {
      if (id.startsWith('\0')) return null
      return transformVueImports(code, id)
    },
  }
}

export default uniappPolyfill
