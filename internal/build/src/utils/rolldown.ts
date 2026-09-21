import { epPackage, getPackageDependencies } from '@element-ai-vue/build-utils'

import type { OutputOptions, RolldownBuild } from 'rolldown'

export const generateExternal = async (options: { full: boolean }) => {
  const { dependencies, peerDependencies } = getPackageDependencies(epPackage)

  return (id: string) => {
    const packages: string[] = [...peerDependencies]
    if (!options.full) {
      packages.push('@vue', ...dependencies)
    }

    return [...new Set(packages)].some(
      (pkg) => id === pkg || id.startsWith(`${pkg}/`)
    )
  }
}

export async function writeBundles(
  bundle: RolldownBuild,
  options: OutputOptions[]
) {
  try {
    // Rolldown runs plugin hooks for each output; do not share plugin state
    // between concurrent writes on the same build.
    for (const option of options) await bundle.write(option)
  } finally {
    await bundle.close()
  }
}

export function formatBundleFilename(
  name: string,
  minify: boolean,
  ext: string
) {
  return `${name}${minify ? '.min' : ''}.${ext}`
}
