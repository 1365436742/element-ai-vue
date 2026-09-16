import { parse } from '@babel/parser'
import MagicString from 'magic-string'

export const VIRTUAL_ID = 'virtual:element-ai-vue/uniapp-polyfill/vue'
export const RESOLVED_ID = '\0' + VIRTUAL_ID

export function transformVueImports(code: string, id: string) {
  if (!code.includes('vue')) return null
  const filename = id.split('?')[0]!
  if (
    /\/(?:element-ai-vue-)?uniapp-polyfill\/(?:dist|src)\/runtime\.[cm]?[jt]s$/.test(
      filename.replace(/\\/g, '/')
    )
  )
    return null
  if (
    !/\.(?:vue|[cm]?[jt]sx?)$/.test(filename) ||
    /\.d\.[cm]?ts$/.test(filename)
  )
    return null
  const query = id.slice(filename.length)
  if (
    /[?&](?:raw|url)(?:[=&]|$)/.test(query) ||
    /[?&]type=(?:style|template)(?:&|$)/.test(query)
  )
    return null

  const ast = parse(code, {
    sourceType: 'module',
    plugins: [
      ...(/\.[cm]?tsx?$/.test(filename) ? ['typescript' as const] : []),
      ...(/\.[jt]sx$/.test(filename) ? ['jsx' as const] : []),
    ],
  })
  const output = new MagicString(code)
  let changed = false

  for (const node of ast.program.body) {
    if (
      node.type !== 'ImportDeclaration' &&
      node.type !== 'ExportNamedDeclaration' &&
      node.type !== 'ExportAllDeclaration'
    )
      continue
    if (node.source?.value !== 'vue') continue
    if (node.type === 'ImportDeclaration' && node.importKind === 'type')
      continue
    if (node.type !== 'ImportDeclaration' && node.exportKind === 'type')
      continue

    const needsPolyfill =
      node.type === 'ExportAllDeclaration' ||
      node.specifiers.some((specifier) => {
        if (
          specifier.type === 'ImportNamespaceSpecifier' ||
          specifier.type === 'ExportNamespaceSpecifier'
        )
          return true
        if (
          specifier.type === 'ImportSpecifier' &&
          specifier.importKind !== 'type'
        ) {
          return (
            (specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value) === 'useTemplateRef'
          )
        }
        if (
          specifier.type === 'ExportSpecifier' &&
          specifier.exportKind !== 'type'
        )
          return specifier.local.name === 'useTemplateRef'
        return false
      })
    if (!needsPolyfill) continue

    // Redirect the module, not individual identifiers: aliases, comments,
    // namespace destructuring and shadowed variables all retain their meaning.
    output.overwrite(
      node.source.start!,
      node.source.end!,
      JSON.stringify(VIRTUAL_ID)
    )
    changed = true
  }

  return changed
    ? {
        code: output.toString(),
        map: output.generateMap({
          hires: true,
          source: id,
          includeContent: true,
        }),
      }
    : null
}
