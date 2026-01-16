import { Node } from '@tiptap/core'

/**
 * KaTeX 块级公式扩展
 * 用于在 Tiptap 编辑器中保留 KaTeX 渲染的数学公式 HTML 结构
 */
export const KatexBlock = Node.create({
  name: 'katexBlock',

  group: 'block',

  atom: true, // 原子节点，不可编辑内部

  selectable: true,

  draggable: false,

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
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const element = node as HTMLElement
          return {
            rawHtml: element.outerHTML,
          }
        },
      },
    ]
  },

  renderHTML() {
    return [
      'span',
      { class: 'katex-display-wrapper', contenteditable: 'false' },
    ]
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span')
      dom.classList.add('katex-display-wrapper')
      dom.setAttribute('contenteditable', 'false')
      dom.innerHTML = node.attrs.rawHtml || ''

      return {
        dom,
      }
    }
  },
})

/**
 * KaTeX 行内公式扩展
 */
export const KatexInline = Node.create({
  name: 'katexInline',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: true,

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
        priority: 60,
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const element = node as HTMLElement
          // 排除 katex-display 内部的 span.katex
          if (element.closest('.katex-display')) {
            return false
          }
          return {
            rawHtml: element.outerHTML,
          }
        },
      },
    ]
  },

  renderHTML() {
    return ['span', { class: 'katex-inline-wrapper', contenteditable: 'false' }]
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span')
      dom.classList.add('katex-inline-wrapper')
      dom.setAttribute('contenteditable', 'false')
      dom.innerHTML = node.attrs.rawHtml || ''

      return {
        dom,
      }
    }
  },
})
