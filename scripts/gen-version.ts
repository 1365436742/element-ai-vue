import { writeFile } from 'fs/promises'
import path from 'path'
import consola from 'consola'
import pkg from '../packages/element-ai-vue/package.json' // need to be checked

// NOTE: keep this script self-contained (do NOT import `@element-ai-vue/build-utils`
// here), as it runs before `pnpm stub` in `postinstall`, when the internal packages'
// `dist` output hasn't been generated yet.
const epRoot = path.resolve(__dirname, '..', 'packages', 'element-ai-vue')

function getVersion() {
  const tagVer = process.env.TAG_VERSION
  if (tagVer) {
    return tagVer.startsWith('v') ? tagVer.slice(1) : tagVer
  } else {
    return pkg.version
  }
}

const version = getVersion()

async function main() {
  consola.info(`Version: ${version}`)
  await writeFile(
    path.resolve(epRoot, 'version.ts'),
    `export const version = '${version}'\n`
  )
}

main()
