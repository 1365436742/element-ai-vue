import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import ts from '@typescript/typescript6'
import postcss from 'postcss'
import * as Vue from 'vue'
import { JSDOM } from 'jsdom'

const root = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(import.meta.url)
const output = path.join(root, 'dist/element-ai-vue')
const baseline = process.argv[2] && path.resolve(process.argv[2])
const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(path.join(dir, entry.name)).map((file) => `${entry.name}/${file}`)
      : [entry.name]
  )

// Compare public names without executing browser-only modules or changing
// dependency resolution through the monorepo's node_modules.
function exportsOf(file, seen = new Set()) {
  if (seen.has(file)) return []
  seen.add(file)
  const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest)
  const names = []
  for (const node of source.statements) {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause) {
        if (ts.isNamedExports(node.exportClause))
          names.push(
            ...node.exportClause.elements.map((item) => item.name.text)
          )
        else names.push(node.exportClause.name.text)
      } else if (node.moduleSpecifier?.text.startsWith('.')) {
        names.push(
          ...exportsOf(
            path.resolve(path.dirname(file), node.moduleSpecifier.text),
            seen
          ).filter((name) => name !== 'default')
        )
      }
    } else if (ts.isExportAssignment(node)) names.push('default')
    else if (
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (node.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword))
        names.push('default')
      else if (ts.isVariableStatement(node))
        names.push(
          ...node.declarationList.declarations.map((item) => item.name.text)
        )
      else if (node.name) names.push(node.name.text)
    }
  }
  return [...new Set(names)].sort()
}

// cssnano may split/merge adjacent selector lists. Compare the ordered
// declarations for each selector and at-rule context instead of whitespace.
function cssRules(file) {
  const rules = new Map()
  postcss.parse(read(file)).walkDecls((decl) => {
    const parents = []
    for (let parent = decl.parent; parent?.parent; parent = parent.parent)
      if (parent.type === 'atrule')
        parents.unshift(`@${parent.name} ${parent.params}`)
    const selectors = decl.parent.type === 'rule' ? decl.parent.selectors : ['']
    for (const selector of selectors) {
      const key = [...parents, selector].join('\n')
      const values = rules.get(key) ?? []
      values.push([decl.prop, decl.value, !!decl.important])
      rules.set(key, values)
    }
  })
  return [...rules].sort(([a], [b]) => a.localeCompare(b))
}

function umd(file, mode) {
  const context = {
    Vue,
    console,
    setTimeout,
    clearTimeout,
    TextEncoder,
    TextDecoder,
    atob,
    btoa,
    structuredClone,
    performance,
  }
  if (mode === 'commonjs') {
    context.exports = {}
    context.module = { exports: context.exports }
    context.require = (id) => {
      assert.equal(id, 'vue', `${file}: unexpected external dependency ${id}`)
      return Vue
    }
  } else if (mode === 'amd') {
    context.define = (dependencies, factory) => {
      if (typeof dependencies === 'function') {
        factory = dependencies
        dependencies = []
      }
      const exports = {}
      const result = factory(
        ...dependencies.map((id) => {
          if (id === 'exports') return exports
          assert.equal(id, 'vue')
          return Vue
        })
      )
      context.amd = result ?? exports
    }
    context.define.amd = true
  }
  vm.runInNewContext(read(file), context, { filename: file, timeout: 20000 })
  if (mode === 'commonjs') return context.module.exports
  if (mode === 'amd') return context.amd
  return (
    context.ElementAiVue ??
    context[
      Object.keys(context).find((key) => key.startsWith('ElementAiVueLocale'))
    ]
  )
}

async function browserInteraction(file) {
  const dom = new JSDOM('<!doctype html><div id="app"></div>', {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })
  const { window } = dom
  Object.assign(window, { TextEncoder, TextDecoder, structuredClone })
  try {
    window.eval(read(require.resolve('vue/dist/vue.global.prod.js')))
    window.eval(read(file))
    const { createApp, h, ref, nextTick } = window.Vue
    const expanded = ref(false)
    const events = []
    const app = createApp({
      render: () =>
        h(
          window.ElementAiVue.ElAThinking,
          {
            title: 'Build compatibility',
            modelValue: expanded.value,
            'onUpdate:modelValue': (value) => {
              events.push(value)
              expanded.value = value
            },
          },
          { default: () => 'Thinking content' }
        ),
    })
    app.mount('#app')
    await nextTick()
    const button = window.document.querySelector('.el-ai-thinking__top--action')
    assert.ok(button, 'Thinking action must render')
    const states = [window.document.querySelector('#app').innerHTML]
    for (let i = 0; i < 2; i++) {
      button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await nextTick()
      states.push(window.document.querySelector('#app').innerHTML)
    }
    assert.deepEqual(
      events,
      [true, false],
      'v-model events must survive bundling'
    )
    app.unmount()
    return states
  } finally {
    window.close()
  }
}

const manifest = json(path.join(output, 'package.json'))
assert.deepEqual(
  manifest,
  json(path.join(root, 'packages/element-ai-vue/package.json'))
)
for (const key of ['main', 'module', 'types', 'style', 'unpkg', 'jsdelivr'])
  assert.ok(
    existsSync(path.join(output, manifest[key])),
    `${key}: missing entry`
  )

const currentFiles = files(output)
let compared = 0
if (baseline) {
  assert.deepEqual(
    manifest,
    json(path.join(baseline, 'package.json')),
    'Published manifest changed'
  )
  for (const file of files(baseline)) {
    const before = path.join(baseline, file)
    const after = path.join(output, file)
    assert.ok(existsSync(after), `Missing previously published file: ${file}`)
    if (file.endsWith('.mjs'))
      assert.deepEqual(
        exportsOf(after),
        exportsOf(before),
        `Exports changed: ${file}`
      )
    else if (file.endsWith('.css'))
      assert.deepEqual(
        cssRules(after),
        cssRules(before),
        `CSS rules changed: ${file}`
      )
    else if (!/\.(js|map)$/.test(file))
      assert.deepEqual(
        readFileSync(after),
        readFileSync(before),
        `Content changed: ${file}`
      )
    // Each preserved source module must still occupy the same public subpath.
    if (/^(es|lib)\/.+\.map$/.test(file) && !file.includes('/_virtual/')) {
      const sources = (name) =>
        json(name)
          .sources.filter((source) => source.includes('/packages/'))
          .map((source) => source.split('/packages/')[1])
          .sort()
      assert.deepEqual(
        sources(after),
        sources(before),
        `Source module moved: ${file}`
      )
    }
    compared++
  }
}

// All generated relative JS imports and source maps must resolve inside the
// package. This catches accidental output nesting and missing runtime helpers.
for (const file of currentFiles) {
  if (!/\.(mjs|js)$/.test(file)) continue
  const absolute = path.join(output, file)
  const source = ts.createSourceFile(
    file,
    read(absolute),
    ts.ScriptTarget.Latest
  )
  const check = (id) => {
    if (id.startsWith('.'))
      assert.ok(
        existsSync(path.resolve(path.dirname(absolute), id)),
        `${file}: missing import ${id}`
      )
    assert.ok(
      !id.startsWith('@element-ai-vue/'),
      `${file}: leaked workspace import ${id}`
    )
  }
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    )
      check(node.moduleSpecifier.text)
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        node.expression.text === 'require') &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      check(node.arguments[0].text)
    ts.forEachChild(node, visit)
  }
  visit(source)
  const map = read(absolute).match(/sourceMappingURL=(.+)/)?.[1]
  if (map) {
    const parsed = json(path.resolve(path.dirname(absolute), map))
    assert.equal(parsed.version, 3, `${file}: invalid source map`)
  }
}

for (const file of currentFiles.filter((file) =>
  /^dist\/locale\/.+\.js$/.test(file)
)) {
  for (const mode of ['browser', 'commonjs', 'amd']) {
    const locale = umd(path.join(output, file), mode)
    assert.equal(typeof locale.name, 'string', `${file}: locale default export`)
    if (baseline)
      assert.equal(
        JSON.stringify(locale),
        JSON.stringify(umd(path.join(baseline, file), mode)),
        `${file}: locale content changed`
      )
  }
}

for (const filename of ['index.full.js', 'index.full.min.js']) {
  const expected = exportsOf(path.join(output, 'es/index.mjs'))
  for (const mode of ['browser', 'commonjs', 'amd']) {
    const library = umd(path.join(output, 'dist', filename), mode)
    assert.deepEqual(
      Object.keys(library).sort(),
      expected,
      `${filename} (${mode}): exports`
    )
    assert.equal(typeof library.default.install, 'function')
    const app = Vue.createSSRApp({ render: () => null })
    app.use(library.default)
    const installed = Object.keys(app._context.components).sort()
    assert.ok(installed.length > 0, 'app.use() must register components')
    if (baseline) {
      const previous = umd(path.join(baseline, 'dist', filename), mode)
      assert.deepEqual(
        Object.keys(library).sort(),
        Object.keys(previous).sort()
      )
      const previousApp = Vue.createSSRApp({ render: () => null })
      previousApp.use(previous.default)
      assert.deepEqual(
        installed,
        Object.keys(previousApp._context.components).sort()
      )
      for (const name of expected.filter((name) => name.startsWith('ElA'))) {
        assert.equal(
          library[name].name,
          previous[name].name,
          `${name}: component name`
        )
        assert.deepEqual(
          Object.keys(library[name].props ?? {}).sort(),
          Object.keys(previous[name].props ?? {}).sort(),
          `${name}: props`
        )
      }
    }
  }
  const states = await browserInteraction(path.join(output, 'dist', filename))
  if (baseline)
    assert.deepEqual(
      states,
      await browserInteraction(path.join(baseline, 'dist', filename)),
      `${filename}: mounted DOM or interaction changed`
    )
}

// oxlint-disable-next-line no-console
console.log(
  `Build compatibility passed: ${compared} baseline files; ${currentFiles.length} output files; ESM exports, UMD browser/CommonJS/AMD, locale values, component registration and interaction, declarations, CSS, assets and source maps.`
)
