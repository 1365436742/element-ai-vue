import { defineComponent, h, type VNode } from 'vue'
import type { Element, RootContent } from 'hast'
import { commonLangs, commonThemes } from '@element-ai-vue/constants'
import { merge, uniq } from 'lodash-es'
import {
  BundledLanguage,
  BundledTheme,
  createHighlighter,
  HighlighterGeneric,
} from 'shiki'

export type HighlighterType = HighlighterGeneric<BundledLanguage, BundledTheme>
export interface GetHighlighterOptions {
  langs?: BundledLanguage[]
  themes?: BundledTheme[]
}

let highlighter: HighlighterType | null = null
let cacheCreateHighlighter: ((highlighter: HighlighterType) => void)[] = []

export const getHighlighter = (options?: GetHighlighterOptions) => {
  return new Promise<HighlighterType>((resolve) => {
    if (highlighter) return resolve(highlighter)
    cacheCreateHighlighter.push(resolve)
    if (cacheCreateHighlighter.length > 1) return
    createHighlighter({
      themes: uniq(merge([], commonThemes, options?.themes || [])),
      langs: uniq(merge([], commonLangs, options?.langs || [])),
    }).then((res) => {
      highlighter = res
      cacheCreateHighlighter.forEach((resolve) => resolve(res))
      cacheCreateHighlighter = []
    })
  })
}

// 将 hast 节点转换为 Vue VNode
export const hastToVNode = (node: RootContent): VNode | string | null => {
  if (node.type === 'text') {
    return node.value
  }
  if (node.type === 'element') {
    const el = node
    const children =
      el.children?.map(hastToVNode).filter((n) => n !== null) || []
    return h(el.tagName, el.properties || {}, children)
  }
  return null
}

/**
 * 渲染 hast 树的组件
 */
export const CodeVNode = defineComponent({
  name: 'CodeVNode',
  props: {
    hast: {
      type: Object as () => Element,
      default: null,
    },
  },
  render() {
    if (!this.hast || !this.hast.children) {
      return h('pre', {}, [h('code', {}, '')])
    }
    const vnodes = this.hast.children
      .map(hastToVNode)
      .filter((n: VNode | string | null) => n !== null)
    return h('div', {}, vnodes)
  },
})
