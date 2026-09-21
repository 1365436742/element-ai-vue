import path from 'path'
import { series } from 'gulp'
import { legacyVueHelper, legacyVueHelperId, vuePlugins } from '../plugins/vue'
import glob from 'fast-glob'
import { epRoot, excludeFiles, pkgRoot } from '@element-ai-vue/build-utils'
import { generateExternal, withTaskName, writeBundles } from '../utils'
import { ElementAiAlias } from '../plugins/element-ai-vue-alias'
import { buildConfigEntries, target } from '../build-info'
import legacyEntryNames from '../legacy-entry-names.json'
import { preserveEmptySourceMaps } from '../plugins/sourcemaps'

import type { TaskFunction } from 'gulp'
import type { OutputOptions } from 'rolldown'

const moduleInputs = (files: string[]) => {
  const sources = new Set(files)
  const entries: Record<string, string> = {}
  for (const file of files) {
    const relative = path.relative(pkgRoot, file).split(path.sep).join('/')
    const base = relative
      .replace(/^element-ai-vue\//, '')
      .replace(/\.(js|ts|vue)$/, '')
    // New components keep index.ts at index and the sibling SFC at index2.
    // Existing components retain the published assignments in the map.
    const hasScriptSibling =
      file.endsWith('.vue') &&
      ['.ts', '.js'].some((ext) => sources.has(file.replace(/\.vue$/, ext)))
    const name =
      (legacyEntryNames as Record<string, string>)[relative] ??
      `${base}${hasScriptSibling ? '2' : ''}`
    if (entries[name]) throw new Error(`Duplicate output entry: ${name}`)
    entries[name] = file
  }
  return entries
}

async function buildModulesComponents() {
  const input = excludeFiles(
    await glob(
      [
        '**/*.{js,ts,vue}',
        '!**/style/(index|css).{js,ts,vue}',
        '!uniapp-polyfill/**',
      ],
      {
        cwd: pkgRoot,
        absolute: true,
        onlyFiles: true,
      }
    )
  )
  const { rolldown } = await import('rolldown')
  const bundle = await rolldown({
    input: {
      ...moduleInputs(input),
      '_virtual/plugin-vue_export-helper': legacyVueHelperId,
    },
    plugins: [ElementAiAlias(), legacyVueHelper(), ...(await vuePlugins())],
    platform: 'neutral',
    resolve: {
      extensions: ['.mjs', '.js', '.json', '.ts'],
      mainFields: ['module', 'main'],
    },
    transform: { target },
    external: await generateExternal({ full: false }),
    treeshake: false,
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

  await writeBundles(
    bundle,
    buildConfigEntries.map(([module, config]): OutputOptions => {
      return {
        format: config.format,
        dir: config.output.path,
        exports: module === 'cjs' ? 'named' : undefined,
        preserveModules: true,
        preserveModulesRoot: epRoot,
        sourcemap: true,
        plugins: [preserveEmptySourceMaps()],
        entryFileNames: `[name].${config.ext}`,
      }
    })
  )
}

async function buildModulesStyles() {
  const input = excludeFiles(
    await glob('**/style/(index|css).{js,ts,vue}', {
      cwd: pkgRoot,
      absolute: true,
      onlyFiles: true,
    })
  )

  const { rolldown } = await import('rolldown')
  const bundle = await rolldown({
    input: moduleInputs(input),
    plugins: [ElementAiAlias(), ...(await vuePlugins())],
    platform: 'neutral',
    resolve: {
      extensions: ['.mjs', '.js', '.json', '.ts'],
      mainFields: ['module', 'main'],
    },
    transform: { target },
    treeshake: false,
  })

  await writeBundles(
    bundle,
    buildConfigEntries.map(([module, config]): OutputOptions => {
      return {
        format: config.format,
        dir: config.output.path,
        exports: module === 'cjs' ? 'named' : undefined,
        preserveModules: true,
        preserveModulesRoot: epRoot,
        sourcemap: true,
        plugins: [preserveEmptySourceMaps()],
        entryFileNames: `[name].${config.ext}`,
      }
    })
  )
}

export const buildModules: TaskFunction = series(
  withTaskName('buildModulesComponents', buildModulesComponents),
  withTaskName('buildModulesStyles', buildModulesStyles)
)
