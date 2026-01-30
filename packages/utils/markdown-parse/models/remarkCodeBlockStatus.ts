import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'

export const remarkCodeBlockStatus: Plugin<[], Root> = () => {
  return (tree, file) => {
    visit(tree, 'code', (node) => {
      if (!node.position || !node.position.end) return

      const end = node.position.end.offset
      // file.value might be string or Buffer.
      const src = String(file.value)

      // Check if the last 3 characters of the node's range are backticks
      // We need to be careful about bounds
      if (end && end >= 3) {
        const last3 = src.slice(end - 3, end)
        const loading = last3 !== '```'

        node.data = node.data || {}
        node.data.hProperties = node.data.hProperties || {}
        // Pass it as a data attribute or property
        // We use 'data-closed' for HTML attribute, but here we can use a custom property
        // that we will read later.
        // remark-rehype will pass 'dataClosed' to properties as 'dataClosed' (or 'data-closed' if configured?)
        // By default, data properties are passed.
        // Let's use a specific property name that we can look for.
        ;(node.data.hProperties as any).loading = loading
      }
    })
  }
}
