import { build } from 'esbuild'
import {
  mkdir,
  rm,
  copyFile,
  readdir,
  readFile,
  writeFile,
  cp,
} from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
process.chdir(fileURLToPath(new URL('..', import.meta.url)))
await rm('dist', { recursive: true, force: true })
await mkdir('dist', { recursive: true })
for (const [format, ext] of [
  ['esm', '.js'],
  ['cjs', '.cjs'],
]) {
  await build({
    entryPoints: {
      index: 'src/index.ts',
      core: 'src/core/index.ts',
      stream: 'src/stream/index.ts',
      ...((await exists('src/collaboration/index.ts'))
        ? { collaboration: 'src/collaboration/index.ts' }
        : {}),
    },
    outdir: 'dist',
    outExtension: { '.js': ext },
    format,
    bundle: true,
    packages: 'external',
    platform: 'neutral',
    target: 'es2022',
    sourcemap: true,
  })
  if (await exists('src/server/index.ts'))
    await build({
      entryPoints: { server: 'src/server/index.ts' },
      outdir: 'dist',
      outExtension: { '.js': ext },
      format,
      bundle: true,
      packages: 'external',
      platform: 'node',
      target: 'node22',
      sourcemap: true,
    })
}
execFileSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json'], {
  stdio: 'inherit',
})
await copyFile('src/style.css', 'dist/style.css')
// The bundled preset geometry definitions retain their upstream Apache license.
for (const file of ['LICENSE-APACHE-2.0.txt', 'NOTICE-APACHE-POI.txt', 'NOTICE.md'])
  await copyFile(`src/drawing/${file}`, `dist/${file}`)
// CommonJS consumers resolve a matching declaration module kind.
async function cjsTypes(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = dir + '/' + entry.name
    if (entry.isDirectory()) await cjsTypes(path)
    else if (path.endsWith('.d.ts'))
      await writeFile(
        path.replace(/\.d\.ts$/, '.d.cts'),
        (await readFile(path, 'utf8')).replace(
          /(from\s+['"])(\.[^'"]*)\.js(['"])/g,
          '$1$2.cjs$3'
        )
      )
  }
}
await cjsTypes('dist')
async function exists(path) {
  try {
    await readFile(path)
    return true
  } catch {
    return false
  }
}
const publishRoot = new URL(
  '../../../dist/element-ai-vue-ppt/',
  import.meta.url
)
await mkdir(publishRoot, { recursive: true })
await cp('dist', new URL('dist/', publishRoot), { recursive: true })
for (const file of ['README.md', 'LICENSE', 'STATUS.md', 'SAMPLE-ACCEPTANCE.md'])
  if (await exists(file)) await copyFile(file, new URL(file, publishRoot))
await cp('examples', new URL('examples/', publishRoot), { recursive: true })
const manifest = JSON.parse(await readFile('package.json', 'utf8'))
delete manifest.scripts
delete manifest.devDependencies
await writeFile(
  new URL('package.json', publishRoot),
  JSON.stringify(manifest, null, 2) + '\n'
)
console.log(
  'Built element-ai-vue-ppt: browser + core + stream + server, ESM/CJS/types/styles'
)
