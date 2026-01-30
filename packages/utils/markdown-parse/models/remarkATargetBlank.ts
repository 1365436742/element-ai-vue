import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'

export const remarkATargetBlank: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'link', (node) => {
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      node.data.hProperties.target = '_blank'
    })
  }
}
