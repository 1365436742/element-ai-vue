import { spawn } from 'child_process'
import readline from 'readline'
import path from 'path'
import consola from 'consola'
import chalk from 'chalk'
import { errorAndExit, getWorkspacePackages } from '@element-ai-vue/build-utils'

import type { Project } from '@pnpm/find-workspace-packages'

const runCommand = (command: string, args: string[], cwd?: string) => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd,
    })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command ${command} failed with code ${code}`))
    })
  })
}

const askQuestion = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close()
      resolve(ans)
    })
  })
}

async function main() {
  consola.log(chalk.cyan('Start publishing process...'))

  const pkgs = Object.fromEntries(
    (await getWorkspacePackages()).map((pkg) => [pkg.manifest.name!, pkg])
  )
  const elementAi = pkgs['element-ai-vue']
  const metadata = pkgs['@element-ai-vue/metadata']

  if (!elementAi) {
    errorAndExit(new Error('element-ai-vue package not found'))
    return
  }

  const currentVersion = elementAi.manifest.version || '0.0.0'
  consola.log(chalk.yellow(`Current version: ${currentVersion}`))

  consola.log('Select version update type:')
  consola.log('1. Patch (小版本) - e.g. 1.1.1 -> 1.1.2')
  consola.log('2. Minor (中版本) - e.g. 1.1.1 -> 1.2.0')
  consola.log('3. Major (大版本) - e.g. 1.1.1 -> 2.0.0')

  let choice = await askQuestion('Enter choice (1/2/3): ')
  while (!['1', '2', '3'].includes(choice.trim())) {
    choice = await askQuestion('Invalid choice. Enter 1, 2, or 3: ')
  }

  const parts = currentVersion.split('.').map(Number)
  // Basic validation
  if (parts.length !== 3 || parts.some(isNaN)) {
    errorAndExit(
      new Error(`Current version ${currentVersion} is not in x.y.z format`)
    )
  }

  if (choice.trim() === '1') {
    parts[2]++
  } else if (choice.trim() === '2') {
    parts[1]++
    parts[2] = 0
  } else if (choice.trim() === '3') {
    parts[0]++
    parts[1] = 0
    parts[2] = 0
  }
  const newVersion = parts.join('.')

  consola.log(chalk.green(`New version will be: ${newVersion}`))

  const writeVersion = async (project: Project) => {
    await project.writeProjectManifest({
      ...project.manifest,
      version: newVersion,
    } as any)
  }

  try {
    await writeVersion(elementAi)
    if (metadata) {
      await writeVersion(metadata)
    }
  } catch (err: any) {
    errorAndExit(err)
  }

  consola.success(chalk.green(`Version updated to ${newVersion}`))

  // build
  consola.info('Executing build...')
  try {
    await runCommand('npm', ['run', 'build'])
  } catch (e) {
    errorAndExit(e as Error)
  }

  // npm login
  consola.info('Executing npm login...')
  try {
    await runCommand('npm', ['login'])
  } catch (e) {
    errorAndExit(e as Error)
  }

  // npm publish
  consola.info('Executing npm publish...')
  try {
    // Publish element-ai-vue
    await runCommand(
      'npm',
      ['publish'],
      path.resolve(process.cwd(), 'dist/element-ai-vue')
    )
  } catch (e) {
    errorAndExit(e as Error)
  }

  // git add .
  consola.info('Executing git add .')
  try {
    await runCommand('git', ['add', '.'])
  } catch (e) {
    errorAndExit(e as Error)
  }

  consola.success('Publish process completed!')
}

main()
