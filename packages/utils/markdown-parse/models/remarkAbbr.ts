import { visit } from 'unist-util-visit'
import type { Root, RootContent } from 'mdast'
import type { Plugin } from 'unified'

export const remarkAbbr: Plugin<[], Root> = () => {
  return (tree) => {
    const abbreviations = new Map<string, string>()
    visit(tree, 'text', (node, index, parent) => {
      const { value } = node
      const abbrMatch = value.match(/^\*\[([^\]]+)\]:\s*(.+)$/)
      if (abbrMatch) {
        const [, abbr, definition] = abbrMatch
        abbreviations.set(abbr, definition)
        if (parent && index !== undefined) {
          /**
           * 匹配到之后删除这个节点即可
           */
          parent.children.splice(index, 1)
        }
      }
    })
    visit(tree, 'text', (node, index, parent) => {
      if (!abbreviations.size) return
      const { value } = node
      abbreviations.forEach((definition, abbr) => {
        const regex = new RegExp(
          `\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
        )
        const match = value.match(regex)
        if (match && match.index !== undefined) {
          const matchInfo = {
            abbr,
            definition,
            start: match.index,
            end: match.index + match[0].length,
          }
          const newChildren: RootContent[] = []
          /**
           * 前面的文本
           */
          if (matchInfo.start > 0) {
            newChildren.push({
              type: 'text',
              value: value.substring(0, matchInfo.start),
            })
          }

          /**
           * abbr标签
           */
          newChildren.push({
            type: 'html',
            value: `<abbr title="${matchInfo.definition}">${matchInfo.abbr}</abbr>`,
          })

          /**
           * 后面的文本
           */
          if (matchInfo.end < value.length) {
            newChildren.push({
              type: 'text',
              value: value.substring(matchInfo.end),
            })
          }
          if (parent && index !== undefined) {
            /**
             * 替换原节点
             */
            parent.children.splice(index, 1, ...newChildren)
          }
        }
      })
    })
  }
}
