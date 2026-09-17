import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = fileURLToPath(new URL('./publish.ts', import.meta.url))
const loader = import.meta.resolve('tsx')
const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim()
const manifests = [
  'packages/element-ai-vue/package.json',
  'packages/uniapp-polyfill/package.json',
  'internal/metadata/package.json',
]

function fixture(t) {
  const temp = realpathSync(
    mkdtempSync(path.join(tmpdir(), 'element-ai-release-'))
  )
  t.after(() => rmSync(temp, { recursive: true, force: true }))
  const root = path.join(temp, 'repo')
  const bin = path.join(temp, 'bin')
  mkdirSync(root)
  mkdirSync(bin)
  const log = path.join(temp, 'events.jsonl')
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    RELEASE_TEST_LOG: log,
    RELEASE_TEST_GIT: realGit,
    HUSKY: '0',
  }
  delete env.NODE_AUTH_TOKEN
  delete env.NPM_TOKEN
  const git = (...args) =>
    execFileSync(realGit, args, { cwd: root, env, encoding: 'utf8' }).trim()
  const write = (file, contents) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    writeFileSync(path.join(root, file), contents)
  }
  const read = (file) => readFileSync(path.join(root, file), 'utf8')
  const json = (file) => JSON.parse(read(file))
  const versions = ['0.1.7', '0.1.0', '0.1.7']
  const names = [
    'element-ai-vue',
    'element-ai-vue-uniapp-polyfill',
    '@element-ai-vue/metadata',
  ]
  for (let i = 0; i < manifests.length; i++) {
    write(
      manifests[i],
      JSON.stringify({ name: names[i], version: versions[i] }, null, 2) + '\n'
    )
  }
  write('.gitignore', 'dist\npackages/element-ai-vue/version.ts\n')
  write(
    'packages/element-ai-vue/version.ts',
    "export const version = '0.1.5'\n"
  )
  git('init', '--quiet', '--initial-branch=main-publish-v1')
  git('config', 'user.name', 'Release Test')
  git('config', 'user.email', 'release@example.invalid')
  git('add', '.')
  git('commit', '--quiet', '-m', 'test fixture')
  const initial = git('rev-parse', 'HEAD')
  writeFileSync(log, '')

  // npm 永远使用本地替身；Git 提交和推送均在临时仓库中真实执行。
  writeFileSync(
    path.join(bin, 'npm'),
    `#!${process.execPath}\n` +
      `
const { appendFileSync, readFileSync, writeFileSync, mkdirSync } = require('node:fs')
const { execFileSync } = require('node:child_process')
const path = require('node:path')
const args = process.argv.slice(2)
const git = (...args) => execFileSync(process.env.RELEASE_TEST_GIT, args, { encoding: 'utf8' }).trim()
const record = (data) => appendFileSync(process.env.RELEASE_TEST_LOG, JSON.stringify(data) + '\\n')
const manifest = (file) => JSON.parse(readFileSync(file, 'utf8'))
record({ args, cwd: process.cwd(), head: git('rev-parse', 'HEAD'), tag: process.env.TAG_VERSION })
if (args[0] === 'whoami') {
  if (process.env.FAIL_AUTH) process.exit(1)
  console.log('release-test')
} else if (args[0] === 'view') {
  const version = args[1].slice(args[1].lastIndexOf('@') + 1)
  const name = args[1].slice(0, args[1].lastIndexOf('@'))
  if ((process.env.PUBLISHED || '').split(',').includes(name)) console.log(JSON.stringify(version))
  else {
    console.log(JSON.stringify({error: {code: process.env.REGISTRY_ERROR || 'E404'}}))
    process.exit(1)
  }
} else if (args[0] === 'run' && args[1] === 'gen:version') {
  writeFileSync('packages/element-ai-vue/version.ts', "export const version = '" + process.env.TAG_VERSION + "'\\n")
} else if (args[0] === 'run' && args[1] === 'build') {
  if (process.env.FAIL_BUILD) process.exit(1)
  for (const file of ['packages/element-ai-vue/package.json', 'packages/uniapp-polyfill/package.json']) {
    const pkg = manifest(file)
    const target = path.join('dist', pkg.name)
    mkdirSync(target, { recursive: true })
    if (process.env.STALE_BUILD) pkg.version = '0.0.0'
    writeFileSync(path.join(target, 'package.json'), JSON.stringify({ ...pkg, main: 'index.cjs', module: 'index.mjs', types: 'index.d.ts' }))
    for (const entry of ['index.cjs', 'index.mjs', 'index.d.ts']) {
      if (process.env.MISSING_ENTRY && entry === 'index.d.ts') continue
      writeFileSync(path.join(target, entry), '// build fixture')
    }
  }
} else if (args[0] === 'publish') {
  const pkg = manifest('package.json')
  const file = pkg.name === 'element-ai-vue' ? 'packages/element-ai-vue/package.json' : 'packages/uniapp-polyfill/package.json'
  if (JSON.parse(git('show', 'HEAD:' + file)).version !== pkg.version) process.exit(90)
  if (process.env.EXPECT_PUSH && !git('ls-remote', 'origin', 'refs/heads/main-publish-v1').startsWith(git('rev-parse', 'HEAD'))) process.exit(91)
  if (process.env.FAIL_PUBLISH === pkg.name) process.exit(1)
} else { console.error('Unexpected npm command: ' + args.join(' ')); process.exit(99) }
`,
    { mode: 0o755 }
  )

  return {
    temp,
    root,
    git,
    write,
    read,
    json,
    initial,
    events: () =>
      readFileSync(log, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(JSON.parse),
    run: (args = [], overrides = {}) =>
      spawnSync(process.execPath, ['--import', loader, script, ...args], {
        cwd: root,
        env: { ...env, ...overrides },
        encoding: 'utf8',
        timeout: 30000,
      }),
  }
}

const published = (f) =>
  f.events().filter((event) => event.args[0] === 'publish')
const assertSuccess = (result) =>
  assert.equal(result.status, 0, result.stdout + result.stderr)

test('两个包分别递增 patch，构建后提交，提交后才发布', (t) => {
  const f = fixture(t)
  assertSuccess(f.run([], { TAG_VERSION: 'stale-environment-version' }))
  assert.deepEqual(
    manifests.map((file) => f.json(file).version),
    ['0.1.8', '0.1.1', '0.1.8']
  )
  assert.equal(
    f.read('packages/element-ai-vue/version.ts'),
    "export const version = '0.1.8'\n"
  )
  const head = f.git('rev-parse', 'HEAD')
  assert.notEqual(head, f.initial)
  assert.equal(
    f.events().find((event) => event.args[1] === 'build').head,
    f.initial
  )
  assert.deepEqual(
    published(f).map((event) => path.relative(f.root, event.cwd)),
    ['dist/element-ai-vue', 'dist/element-ai-vue-uniapp-polyfill']
  )
  assert.ok(published(f).every((event) => event.head === head))
  assert.deepEqual(
    f
      .git('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD')
      .split('\n')
      .sort(),
    [...manifests].sort()
  )
  assert.match(
    f.git('log', '-1', '--format=%s'),
    /^chore\(release\): .*\[skip ci\]$/
  )
  assert.equal(f.git('status', '--porcelain'), '')
})

test('CI 先推送版本提交，再发布两个包', (t) => {
  const f = fixture(t)
  const remote = path.join(f.temp, 'remote.git')
  f.git('init', '--quiet', '--bare', remote)
  f.git('remote', 'add', 'origin', remote)
  assertSuccess(f.run(['--push'], { EXPECT_PUSH: '1' }))
  assert.equal(published(f).length, 2)
})

for (const failure of [
  'FAIL_BUILD',
  'FAIL_COMMIT',
  'STALE_BUILD',
  'MISSING_ENTRY',
]) {
  test(`${failure} 时恢复版本，不发布`, (t) => {
    const f = fixture(t)
    if (failure === 'FAIL_COMMIT') {
      writeFileSync(
        path.join(f.root, '.git/hooks/commit-msg'),
        '#!/bin/sh\nexit 1\n',
        { mode: 0o755 }
      )
    }
    assert.notEqual(f.run([], { [failure]: '1' }).status, 0)
    assert.deepEqual(
      manifests.map((file) => f.json(file).version),
      ['0.1.7', '0.1.0', '0.1.7']
    )
    assert.equal(
      f.read('packages/element-ai-vue/version.ts'),
      "export const version = '0.1.5'\n"
    )
    assert.equal(f.git('rev-parse', 'HEAD'), f.initial)
    assert.equal(f.git('status', '--porcelain'), '')
    assert.equal(published(f).length, 0)
  })
}

test('推送失败时保留版本提交，不发布', (t) => {
  const f = fixture(t)
  const result = f.run(['--push']) // 没有配置 origin，模拟推送失败。
  assert.notEqual(result.status, 0)
  assert.notEqual(f.git('rev-parse', 'HEAD'), f.initial)
  assert.equal(f.json(manifests[0]).version, '0.1.8')
  assert.equal(published(f).length, 0)
  assert.match(result.stderr, /--resume --push/)
})

test('一个包失败仍尝试另一个；重试不递增、不重复发布成功的包', (t) => {
  const f = fixture(t)
  assert.notEqual(f.run([], { FAIL_PUBLISH: 'element-ai-vue' }).status, 0)
  assert.equal(published(f).length, 2)
  const head = f.git('rev-parse', 'HEAD')
  assertSuccess(
    f.run(['--resume'], { PUBLISHED: 'element-ai-vue-uniapp-polyfill' })
  )
  assert.equal(f.git('rev-parse', 'HEAD'), head)
  assert.deepEqual(
    manifests.map((file) => f.json(file).version),
    ['0.1.8', '0.1.1', '0.1.8']
  )
  assert.equal(published(f).length, 3)
  assert.equal(path.basename(published(f)[2].cwd), 'element-ai-vue')
})

for (const overrides of [
  { FAIL_AUTH: '1' },
  { REGISTRY_ERROR: 'E401' },
  { REGISTRY_ERROR: 'ENOTFOUND' },
  { PUBLISHED: 'element-ai-vue' },
]) {
  test(`认证或版本检查失败时不修改版本：${JSON.stringify(overrides)}`, (t) => {
    const f = fixture(t)
    assert.notEqual(f.run([], overrides).status, 0)
    assert.equal(f.git('rev-parse', 'HEAD'), f.initial)
    assert.equal(f.git('status', '--porcelain'), '')
    assert.ok(!f.events().some((event) => event.args[0] === 'run'))
    assert.equal(published(f).length, 0)
  })
}

test('拒绝将已有暂存改动或未跟踪文件混入版本提交', (t) => {
  const f = fixture(t)
  f.write('unrelated.txt', 'keep my changes')
  assert.notEqual(f.run().status, 0)
  f.git('add', 'unrelated.txt')
  assert.notEqual(f.run().status, 0)
  assert.equal(f.read('unrelated.txt'), 'keep my changes')
  assert.equal(f.git('diff', '--cached', '--name-only'), 'unrelated.txt')
  assert.equal(f.git('rev-parse', 'HEAD'), f.initial)
  assert.equal(f.events().length, 0)
})
