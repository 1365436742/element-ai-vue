import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import KatexNodeView from './index.vue'

/**
 * 块级 KaTeX 公式扩展
 * 匹配 rehype-katex 生成的 <span class="katex-display"> 元素
 * 优先级高于行内，确保 katex-display 先匹配，其子节点不再被行内规则处理
 */
export const KatexBlock = Node.create({
  name: 'katexBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      rawHtml: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.katex-display',
        priority: 60,
        getAttrs(dom) {
          return {
            rawHtml: (dom as HTMLElement).outerHTML,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'katex-block' }),
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(KatexNodeView)
  },
})

/**
 * 行内 KaTeX 公式扩展
 * 匹配 rehype-katex 生成的 <span class="katex"> 元素
 */
export const KatexInline = Node.create({
  name: 'katexInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      rawHtml: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.katex',
        priority: 51,
        getAttrs(dom) {
          return {
            rawHtml: (dom as HTMLElement).outerHTML,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'katex-inline' }),
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(KatexNodeView)
  },
})
