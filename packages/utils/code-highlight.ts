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
