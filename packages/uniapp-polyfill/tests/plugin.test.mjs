import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build as esbuild } from 'esbuild'
import { build as viteBuild } from 'vite'
import uniappPolyfill from '../dist/index.mjs'

const require = createRequire(import.meta.url)
const virtual = 'virtual:element-ai-vue/uniapp-polyfill/vue'
const plugin = uniappPolyfill()
const vue34 = `
  export const shallowRef = value => ({ value })
  export const getCurrentInstance = () => null
  export const onBeforeMount = () => {}
  export const warn = () => {}
  export const version = '3.4.21'
`

test('ESM and CommonJS publish entries expose the same factory', () => {
  const cjs = require('../dist/index.cjs')
  assert.equal(cjs.default().name, plugin.name)
  assert.equal(cjs.uniappPolyfill, cjs.default)
})

test('rewrites named imports, aliases, re-exports and namespaces without altering code', () => {
  for (const code of [
    "import { ref, /* comment */ useTemplateRef as template } from 'vue'; template('x')",
    "import Vue, { useTemplateRef } from 'vue'",
    "export { useTemplateRef as template, ref } from 'vue'",
    "export * from 'vue'",
    "export * as Vue from 'vue'",
    "import * as Vue from 'vue'; const { useTemplateRef } = Vue; function f(Vue) { return Vue.useTemplateRef }",
    "import * as Vue from 'vue'; Vue['useTemplateRef']('x')",
    'import { "useTemplateRef" as template } from "vue"',
  ]) {
    const result = plugin.transform(code, '/test/module.mjs')
    assert.ok(result, code)
    assert.equal(
      result.code,
      code.replace(/(['"])vue\1/, JSON.stringify(virtual))
    )
    assert.ok(result.map.mappings.length)
    assert.deepEqual(result.map.sourcesContent, [code])
  }
})

test('ignores types, comments, strings, other modules and non-script resources', () => {
  for (const code of [
    "import { ref } from 'vue'",
    "import type { useTemplateRef } from 'vue'",
    "import { type useTemplateRef, ref } from 'vue'",
    "export type { useTemplateRef } from 'vue'",
    "import { useTemplateRef } from 'other-lib'",
    "// import { useTemplateRef } from 'vue'\nconst s = `import { useTemplateRef } from 'vue'`",
  ])
    assert.equal(plugin.transform(code, '/test/module.ts'), null)

  for (const id of [
    '/x.css',
    '/x.d.ts',
    '/x.d.mts',
    '/x.vue?vue&type=style',
    '/x.js?raw',
    '/x.js?url',
    '\0other:virtual',
  ]) {
    assert.equal(
      plugin.transform("import { useTemplateRef } from 'vue'", id),
      null
    )
  }
})

test('handles TypeScript and compiled Vue modules', () => {
  assert.ok(
    plugin.transform(
      "import { type Ref, useTemplateRef } from 'vue'; const el = useTemplateRef<HTMLElement>('el')",
      '/x.ts'
    )
  )
  assert.ok(
    plugin.transform(
      "import { useTemplateRef } from 'vue'; const el = useTemplateRef('el')",
      '/x.vue'
    )
  )
  assert.ok(
    plugin.transform(
      "import { useTemplateRef } from 'vue'",
      '/x.vue?vue&type=script&setup=true&lang.ts'
    )
  )
})

test('runtime entry is never redirected back to itself', () => {
  const code =
    "import * as Vue from 'vue'; export const useTemplateRef = Reflect.get(Vue, 'useTemplateRef')"
  assert.equal(
    plugin.transform(
      code,
      '/app/node_modules/element-ai-vue-uniapp-polyfill/dist/runtime.mjs'
    ),
    null
  )
  assert.equal(
    plugin.transform(code, '/repo/packages/uniapp-polyfill/dist/runtime.cjs'),
    null
  )
})

test('virtual module keeps the platform Vue alias and includes the shipped runtime', () => {
  assert.equal(plugin.resolveId(virtual), '\0' + virtual)
  const code = plugin.load('\0' + virtual)
  assert.match(code, /export \* from 'vue'/)
  assert.match(code, /useTemplateRefFallback/)
  assert.equal(plugin.resolveId('vue'), undefined)
  assert.equal(plugin.load('vue'), undefined)
  assert.equal(plugin.transform(code, '\0' + virtual), null)
})

test('production build works against a Vue runtime missing useTemplateRef', async () => {
  const root = await mkdtemp(join(tmpdir(), 'uniapp-polyfill-build-'))
  try {
    await writeFile(
      join(root, 'vue.js'),
      vue34 + 'export const ref = () => 123'
    )
    await writeFile(
      join(root, 'main.js'),
      `import { ref, useTemplateRef } from 'vue'; export { ref, useTemplateRef }`
    )
    const result = await viteBuild({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [uniappPolyfill()],
      resolve: { alias: { vue: join(root, 'vue.js') } },
      build: {
        write: false,
        minify: false,
        lib: { entry: join(root, 'main.js'), formats: ['es'] },
      },
    })
    const { code } = result[0].output.find((output) => output.type === 'chunk')
    const module = await import(
      'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
    )
    assert.equal(module.ref(), 123)
    assert.equal(typeof module.useTemplateRef, 'function')
    assert.equal(module.useTemplateRef('outside').value, null)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('dependency optimizer bundles a dependency without excluding it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'uniapp-polyfill-optimize-'))
  try {
    await writeFile(
      join(root, 'vue.js'),
      vue34 + 'export const ref = () => 456'
    )
    await writeFile(
      join(root, 'dependency.js'),
      `import * as Vue from 'vue'; export const ref = Vue.ref; export const useTemplateRef = Vue.useTemplateRef`
    )
    const config = plugin.config({ root })
    const result = await esbuild({
      absWorkingDir: root,
      entryPoints: ['dependency.js'],
      bundle: true,
      write: false,
      format: 'esm',
      alias: { vue: join(root, 'vue.js') },
      plugins: config.optimizeDeps.esbuildOptions.plugins,
    })
    const module = await import(
      'data:text/javascript;base64,' +
        Buffer.from(result.outputFiles[0].text).toString('base64')
    )
    assert.equal(module.ref(), 456)
    assert.equal(typeof module.useTemplateRef, 'function')
    assert.equal(module.useTemplateRef('outside').value, null)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('npm manifest only exports existing distributable files', async () => {
  const sourceRoot = new URL('../', import.meta.url)
  const publishRoot = new URL(
    '../../../dist/element-ai-vue-uniapp-polyfill/',
    import.meta.url
  )
  for (const root of [sourceRoot, publishRoot]) {
    const manifest = JSON.parse(await readFile(new URL('package.json', root)))
    assert.equal(manifest.name, 'element-ai-vue-uniapp-polyfill')
    for (const key of ['.', './runtime']) {
      for (const format of ['import', 'require']) {
        for (const file of Object.values(manifest.exports[key][format])) {
          assert.ok((await readFile(new URL(file, root))).length)
        }
      }
    }
    assert.ok(!JSON.stringify(manifest.exports).includes('src/'))
    if (root === publishRoot) {
      assert.equal(manifest.scripts, undefined)
      assert.equal(manifest.devDependencies, undefined)
      assert.ok(manifest.dependencies['@babel/parser'])
      assert.ok(manifest.dependencies['magic-string'])
      assert.ok(manifest.peerDependencies.vue)
      assert.ok(manifest.peerDependencies.vite)
      for (const file of ['README.md', 'LICENSE']) {
        assert.equal(
          await readFile(new URL(file, root), 'utf8'),
          await readFile(new URL(file, sourceRoot), 'utf8')
        )
      }
    }
  }
})

test('declarations resolve for both ESM and CommonJS TypeScript consumers', async () => {
  const root = await mkdtemp(join(tmpdir(), 'uniapp-polyfill-types-'))
  try {
    await mkdir(join(root, 'node_modules'), { recursive: true })
    await symlink(
      fileURLToPath(new URL('..', import.meta.url)),
      join(root, 'node_modules/element-ai-vue-uniapp-polyfill')
    )
    const code = `
      import plugin from 'element-ai-vue-uniapp-polyfill'
      import { useTemplateRef } from 'element-ai-vue-uniapp-polyfill/runtime'
      const p = plugin({ excludeDeps: ['example'] })
      const value: HTMLElement | null = useTemplateRef<HTMLElement>('el').value
    `
    await writeFile(join(root, 'check.mts'), code)
    await writeFile(join(root, 'check.cts'), code)
    execFileSync(
      process.execPath,
      [
        require.resolve('typescript/bin/tsc'),
        '--noEmit',
        '--module',
        'NodeNext',
        '--moduleResolution',
        'NodeNext',
        '--target',
        'ES2020',
        '--strict',
        'check.mts',
        'check.cts',
      ],
      { cwd: root, stdio: 'pipe' }
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
