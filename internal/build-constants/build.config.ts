import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node20.19',
  tsconfig: '../../tsconfig.node.json',
  clean: true,
  dts: true,
  shims: true,
  deps: { neverBundle: true, dts: { neverBundle: true } },
  outExtensions: ({ format }) => ({
    js: format === 'cjs' ? '.cjs' : '.mjs',
    dts: format === 'cjs' ? '.d.cts' : '.d.ts',
  }),
})
