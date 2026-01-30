import { visit } from 'unist-util-visit'
import type { Root, RootContent } from 'mdast'
import type { Plugin } from 'unified'

const markers: { [key: string]: string } = {
  '~': 'sub',
  '^': 'sup',
}

export const remarkSubSuper: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      const { value } = node

      /**
       * 使用正则表达式匹配 ~x~ 或 ^x^ 格式
       */
      const regex = /([~^])([^~^]?)\1/g

      if (!regex.test(value)) return

      const newChildren: RootContent[] = []
      let lastIndex = 0

      /**
       * 重置正则表达式
       */
      regex.lastIndex = 0
      let match

      while ((match = regex.exec(value)) !== null) {
        const [fullMatch, marker, content] = match
        const startIndex = match.index

        /**
         * 添加标记前的文本
         */
        if (startIndex > lastIndex) {
          newChildren.push({
            type: 'text',
            value: value.substring(lastIndex, startIndex),
          })
        }

        /**
         * 添加上下标HTML
         */
        const tagName = markers[marker]
        newChildren.push({
          type: 'html',
          value: `<${tagName}>${content}</${tagName}>`,
        })

        lastIndex = startIndex + fullMatch.length
      }

      /**
       * 添加剩余文本
       */
      if (lastIndex < value.length) {
        newChildren.push({
          type: 'text',
          value: value.substring(lastIndex),
        })
      }

      /**
       * 替换原节点
       */
      if (parent && typeof index === 'number' && newChildren.length > 1) {
        parent.children.splice(index, 1, ...newChildren)
      }
    })
  }
}
