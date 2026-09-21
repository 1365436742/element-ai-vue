import path from 'path'
import { vuePlugins } from '../plugins/vue'
import { parallel } from 'gulp'
import glob from 'fast-glob'
import { camelCase, upperFirst } from 'lodash-unified'
import {
  PKG_BRAND_NAME,
  PKG_CAMELCASE_LOCAL_NAME,
  PKG_CAMELCASE_NAME,
} from '@element-ai-vue/build-constants'
import { epOutput, epRoot, localeRoot } from '@element-ai-vue/build-utils'
import { version } from '../../../../packages/element-ai-vue/version'
import { ElementAiAlias } from '../plugins/element-ai-vue-alias'
import {
  formatBundleFilename,
  generateExternal,
  withTaskName,
  writeBundles,
} from '../utils'
import { target } from '../build-info'

import type { TaskFunction } from 'gulp'

const banner = `/*! ${PKG_BRAND_NAME} v${version} */\n`

async function buildFullEntry(minify: boolean) {
  const { rolldown } = await import('rolldown')
  const bundle = await rolldown({
    input: path.resolve(epRoot, 'index.ts'),
    plugins: [ElementAiAlias(), ...(await vuePlugins())],
    platform: 'neutral',
    resolve: {
      extensions: ['.mjs', '.js', '.json', '.ts'],
      mainFields: ['module', 'main'],
    },
    transform: { target, define: { 'process.env.NODE_ENV': '"production"' } },
    external: await generateExternal({ full: true }),
    treeshake: true,
    onwarn(warning, warn) {
      if (warning.code === 'UNRESOLVED_IMPORT') throw new Error(warning.message)
      if (warning.code === 'CIRCULAR_DEPENDENCY') {
        if (warning.message.includes('node_modules')) {
          return
        }
      }
      warn(warning)
    },
  })
  // Normalize external star re-exports to ESM namespace imports first.
  // A direct UMD build currently emits require('vue') inside the browser
  // factory for vue-demi's `export * from 'vue'`.
  const normalizedId = path.resolve(
    epOutput,
    'dist/index.full.intermediate.mjs'
  )
  const { output } = await bundle.generate({
    format: 'esm',
    file: normalizedId,
    codeSplitting: false,
    sourcemap: minify,
  })
  await bundle.close()
  const entry = output.find((item) => item.type === 'chunk' && item.isEntry)
  if (!entry || entry.type !== 'chunk')
    throw new Error('Missing full bundle entry')
  const normalized = await rolldown({
    input: normalizedId,
    external: await generateExternal({ full: true }),
    transform: { target },
    treeshake: false,
    plugins: [
      {
        name: 'normalized-full-entry',
        resolveId(id) {
          if (id === normalizedId) return id
        },
        load(id) {
          if (id === normalizedId) return { code: entry.code, map: entry.map }
        },
      },
    ],
  })
  await writeBundles(normalized, [
    {
      format: 'umd',
      file: path.resolve(
        epOutput,
        'dist',
        formatBundleFilename('index.full', minify, 'js')
      ),
      exports: 'named',
      name: PKG_CAMELCASE_NAME,
      globals: {
        vue: 'Vue',
      },
      sourcemap: minify,
      minify,
      banner,
      codeSplitting: false,
    },
    {
      format: 'esm',
      file: path.resolve(
        epOutput,
        'dist',
        formatBundleFilename('index.full', minify, 'mjs')
      ),
      sourcemap: minify,
      minify,
      banner,
      codeSplitting: false,
    },
  ])
}

async function buildFullLocale(minify: boolean) {
  const files = await glob(`**/*.ts`, {
    cwd: path.resolve(localeRoot, 'lang'),
    absolute: true,
  })
  return Promise.all(
    files.map(async (file) => {
      const filename = path.basename(file, '.ts')
      const name = upperFirst(camelCase(filename))

      const { rolldown } = await import('rolldown')
      const bundle = await rolldown({
        input: file,
        transform: { target },
      })
      await writeBundles(bundle, [
        {
          format: 'umd',
          file: path.resolve(
            epOutput,
            'dist/locale',
            formatBundleFilename(filename, minify, 'js')
          ),
          exports: 'default',
          name: `${PKG_CAMELCASE_LOCAL_NAME}${name}`,
          sourcemap: minify,
          minify,
          banner,
        },
        {
          format: 'esm',
          file: path.resolve(
            epOutput,
            'dist/locale',
            formatBundleFilename(filename, minify, 'mjs')
          ),
          sourcemap: minify,
          minify,
          banner,
        },
      ])
    })
  )
}

export const buildFull = (minify: boolean) => async () =>
  Promise.all([buildFullEntry(minify), buildFullLocale(minify)])

export const buildFullBundle: TaskFunction = parallel(
  withTaskName('buildFullMinified', buildFull(true)),
  withTaskName('buildFull', buildFull(false))
)
