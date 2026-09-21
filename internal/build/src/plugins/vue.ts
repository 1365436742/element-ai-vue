import type { Plugin } from 'rolldown'
import { compiler } from '../../../vue-types/compiler'

// Use the same production template optimizations as the previous build.
export const vuePlugins = async () => {
  const { default: vue } = await import('unplugin-vue/rolldown')
  return [
    vue({
      compiler,
      isProduction: true,
      template: {
        compilerOptions: {
          hoistStatic: false,
          cacheHandlers: false,
        },
      },
    }),
  ]
}

// Preserve the previously published helper subpath even though unplugin-vue
// now inlines this helper in compiled components.
export const legacyVueHelperId = 'virtual:legacy-vue-export-helper'
export const legacyVueHelper = (): Plugin => ({
  name: 'legacy-vue-export-helper',
  resolveId(id: string) {
    if (id === legacyVueHelperId) return `\0${id}`
  },
  load(id: string) {
    if (id === `\0${legacyVueHelperId}`)
      return `export default (sfc, props) => {
        const target = sfc.__vccOpts || sfc;
        for (const [key, value] of props) target[key] = value;
        return target;
      }`
  },
})
