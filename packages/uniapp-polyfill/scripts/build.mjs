import { build } from 'esbuild'
import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('..', import.meta.url))
process.chdir(root)
await rm('dist', { recursive: true, force: true })
await mkdir('dist', { recursive: true })

const runtime = await build({
  entryPoints: ['src/runtime.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  target: 'es2018',
  external: ['vue'],
})

for (const [format, extension] of [
  ['esm', 'mjs'],
  ['cjs', 'cjs'],
]) {
  await build({
    entryPoints: { index: 'src/index.ts', runtime: 'src/runtime.ts' },
    outdir: 'dist',
    outExtension: { '.js': `.${extension}` },
    format,
    platform: 'node',
    target: 'es2018',
    bundle: true,
    packages: 'external',
    sourcemap: true,
    define: {
      __UNIAPP_POLYFILL_RUNTIME__: JSON.stringify(runtime.outputFiles[0].text),
    },
  })
}

execFileSync(
  process.execPath,
  [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.json'],
  { stdio: 'inherit' }
)
await Promise.all(
  ['index', 'runtime'].map((name) =>
    copyFile(`dist/${name}.d.ts`, `dist/${name}.d.cts`)
  )
)
await rm('dist/transform.d.ts', { force: true })

// Keep local imports working and also assemble a standalone npm package beside
// the main library's output. Repository-only scripts must not run on publish.
const publishRoot = new URL(
  '../../../dist/element-ai-vue-uniapp-polyfill/',
  import.meta.url
)
const manifest = JSON.parse(await readFile('package.json', 'utf8'))
delete manifest.scripts
delete manifest.devDependencies

await rm(publishRoot, { recursive: true, force: true })
await mkdir(publishRoot, { recursive: true })
await Promise.all([
  cp('dist', new URL('dist/', publishRoot), { recursive: true }),
  copyFile('README.md', new URL('README.md', publishRoot)),
  copyFile('LICENSE', new URL('LICENSE', publishRoot)),
  writeFile(
    new URL('package.json', publishRoot),
    JSON.stringify(manifest, null, 2) + '\n'
  ),
])
process.stdout.write(
  'Built uniapp-polyfill: ESM, CommonJS, declarations and source maps.\n' +
    `Publish directory: ${fileURLToPath(publishRoot)}\n`
)
