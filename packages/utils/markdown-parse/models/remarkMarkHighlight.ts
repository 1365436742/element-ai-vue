import { visit } from 'unist-util-visit'
import type { Root, RootContent } from 'mdast'
import type { Plugin } from 'unified'

export const remarkMarkHighlight: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      const { value } = node
      if (value.includes('==')) {
        const parts = value.split(/==(.*?)==/g)
        const newChildren: RootContent[] = []

        for (let i = 0; i < parts.length; i++) {
          if (i % 2 === 0) {
            /** 普通文本 */
            if (parts[i]) {
              newChildren.push({ type: 'text', value: parts[i] })
            }
          } else {
            /** 高亮文本 */
            newChildren.push({
              type: 'html',
              value: `<mark>${parts[i]}</mark>`,
            })
          }
        }
        if (parent && typeof index === 'number') {
          parent.children.splice(index, 1, ...newChildren)
        }
      }
    })
  }
}
