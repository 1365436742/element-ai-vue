import type { Plugin } from 'rolldown'

// Rollup emitted empty maps for re-export/style-only modules. Rolldown omits
// them, so retain these files and their references for the published subpaths.
export const preserveEmptySourceMaps = (): Plugin => ({
  name: 'preserve-empty-source-maps',
  generateBundle(options, bundle) {
    if (!options.sourcemap) return
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue
      const fileName = `${chunk.fileName}.map`
      if (bundle[fileName]) continue
      this.emitFile({
        type: 'asset',
        fileName,
        source: JSON.stringify({
          version: 3,
          file: chunk.fileName.split('/').pop(),
          sources: [],
          sourcesContent: [],
          names: [],
          mappings: '',
        }),
      })
      chunk.code += `\n//# sourceMappingURL=${fileName.split('/').pop()}\n`
    }
  },
})
