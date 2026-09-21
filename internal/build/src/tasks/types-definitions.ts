import path from 'path'
import { readFile, writeFile } from 'fs/promises'
import glob from 'fast-glob'
import { copy, remove } from 'fs-extra'
import { buildOutput } from '@element-ai-vue/build-utils'
import { pathRewriter, run } from '../utils'

export const generateTypesDefinitions = async () => {
  await run('pnpm --filter @element-ai-vue/vue-types emit')
  const typesDir = path.join(buildOutput, 'types', 'packages')
  const filePaths = await glob(`**/*.d.ts`, {
    cwd: typesDir,
    absolute: true,
  })
  const rewriteTasks = filePaths.map(async (filePath) => {
    const content = await readFile(filePath, 'utf8')
    await writeFile(filePath, pathRewriter('esm')(content), 'utf8')
  })
  await Promise.all(rewriteTasks)
  const sourceDir = path.join(typesDir, 'element-ai-vue')
  await copy(sourceDir, typesDir)
  await remove(sourceDir)
}
