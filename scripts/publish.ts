import { execFileSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import consola from 'consola'

const root = process.cwd()
const registry = 'https://registry.npmjs.org/'
const packages = [
  { name: 'element-ai-vue', manifest: 'packages/element-ai-vue/package.json' },
  // {
  //   name: 'element-ai-vue-uniapp-polyfill',
  //   manifest: 'packages/uniapp-polyfill/package.json',
  // },
]
const metadataManifest = 'internal/metadata/package.json'
const generatedVersion = 'packages/element-ai-vue/version.ts'
const releaseFiles = [...packages.map((pkg) => pkg.manifest), metadataManifest]

const readManifest = (file: string) =>
  JSON.parse(readFileSync(path.resolve(root, file), 'utf8'))

function run(command: string, args: string[], cwd = root, env = process.env) {
  execFileSync(command, args, { cwd, env, stdio: 'inherit' })
}

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

function nextPatch(version: string) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`版本号必须是 x.y.z 格式：${version}`)
  }
  const [major, minor, patch] = version.split('.').map(Number)
  if (![major, minor, patch + 1].every(Number.isSafeInteger)) {
    throw new Error(`版本号超出支持范围：${version}`)
  }
  return `${major}.${minor}.${patch + 1}`
}

function isPublished(name: string, version: string) {
  const spec = `${name}@${version}`
  const result = spawnSync(
    'npm',
    ['view', spec, 'version', '--json', '--registry', registry],
    { cwd: root, encoding: 'utf8' }
  )
  if (result.error) throw result.error
  let response
  try {
    response = JSON.parse(result.stdout)
  } catch {
    throw new Error(`无法查询 ${spec}：${result.stderr || result.stdout}`)
  }
  if (result.status === 0 && response === version) return true
  // 认证、网络等错误不能当作“尚未发布”。
  if (result.status !== 0 && response?.error?.code === 'E404') return false
  throw new Error(`无法查询 ${spec}：${result.stderr || result.stdout}`)
}

async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => !['--resume', '--push'].includes(arg))) {
    throw new Error('用法：npm run publish -- [--resume] [--push]')
  }
  const resume = args.includes('--resume')
  const push = args.includes('--push')

  if (git('status', '--porcelain', '--untracked-files=all')) {
    throw new Error('请先提交或用 git stash 保存现有改动，再运行发布命令。')
  }
  git('ls-files', '--error-unmatch', ...releaseFiles)
  if (
    !resume &&
    (!git('config', 'user.name') || !git('config', 'user.email'))
  ) {
    throw new Error('请先配置 Git user.name 和 user.email。')
  }
  const branch = push ? git('symbolic-ref', '--quiet', '--short', 'HEAD') : ''
  // 使用本机 npm 登录信息或 CI 的 NODE_AUTH_TOKEN，不再强制交互登录。
  run('npm', ['whoami', '--registry', registry])

  const releases = packages.map((pkg) => {
    const manifest = readManifest(pkg.manifest)
    if (manifest.name !== pkg.name)
      throw new Error(`包名不匹配：${pkg.manifest}`)
    const bumpedVersion = nextPatch(manifest.version)
    const version = resume ? manifest.version : bumpedVersion
    const published = isPublished(pkg.name, version)
    if (!resume && published) {
      throw new Error(`${pkg.name}@${version} 已发布，请先同步 Git 版本记录。`)
    }
    consola.info(
      `${pkg.name}: ${manifest.version} → ${version}${published ? '（已发布，跳过）' : ''}`
    )
    return { ...pkg, manifestData: manifest, version, published }
  })
  const mainVersion = releases[0].version
  const originals = new Map(
    [...releaseFiles, generatedVersion].map((file) => [
      file,
      existsSync(path.resolve(root, file))
        ? readFileSync(path.resolve(root, file))
        : undefined,
    ])
  )
  let committed = false

  try {
    if (!resume) {
      for (const release of releases) {
        writeFileSync(
          path.resolve(root, release.manifest),
          JSON.stringify(
            { ...release.manifestData, version: release.version },
            null,
            2
          ) + '\n'
        )
      }
      writeFileSync(
        path.resolve(root, metadataManifest),
        JSON.stringify(
          { ...readManifest(metadataManifest), version: mainVersion },
          null,
          2
        ) + '\n'
      )
    }

    const buildEnv = { ...process.env, TAG_VERSION: mainVersion }
    run('npm', ['run', 'gen:version'], root, buildEnv)
    run('npm', ['run', 'build'], root, buildEnv)

    for (const release of releases) {
      const directory = path.resolve(root, 'dist', release.name)
      const manifest = readManifest(path.join(directory, 'package.json'))
      if (
        manifest.name !== release.name ||
        manifest.version !== release.version
      ) {
        throw new Error(`构建产物的包名或版本不匹配：${directory}`)
      }
      for (const entry of ['main', 'module', 'types']) {
        if (
          !manifest[entry] ||
          !statSync(path.resolve(directory, manifest[entry])).isFile()
        ) {
          throw new Error(`构建产物缺少 ${entry}：${directory}`)
        }
      }
    }

    if (!resume) {
      const versions = releases
        .map((release) => `${release.name}@${release.version}`)
        .join(', ')
      // 仅提交版本文件；现有 Husky hook 会格式化全仓库，不用于自动版本提交。
      run(
        'git',
        [
          'commit',
          '--only',
          '-m',
          `chore(release): ${versions} [skip ci]`,
          '--',
          ...releaseFiles,
        ],
        root,
        {
          ...process.env,
          HUSKY: '0',
        }
      )
      committed = true
    }
    if (push) run('git', ['push', 'origin', `HEAD:refs/heads/${branch}`])

    const failed: string[] = []
    for (const release of releases) {
      if (release.published) continue
      try {
        run(
          'npm',
          ['publish', '--access', 'public', '--registry', registry],
          path.resolve(root, 'dist', release.name)
        )
      } catch {
        failed.push(`${release.name}@${release.version}`)
      }
    }
    if (failed.length) throw new Error(`以下包发布失败：${failed.join(', ')}`)
    consola.success('两个 npm 包均已发布。')
  } catch (error) {
    if (!committed && !resume) {
      for (const [file, content] of originals) {
        if (content === undefined)
          rmSync(path.resolve(root, file), { force: true })
        else writeFileSync(path.resolve(root, file), content)
      }
      consola.error('版本提交前失败，已恢复原版本文件。')
    } else {
      consola.error(
        `版本记录已保留。修复错误后执行：npm run publish -- --resume${push ? ' --push' : ''}`
      )
    }
    throw error
  }
}

main().catch((error) => {
  consola.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
