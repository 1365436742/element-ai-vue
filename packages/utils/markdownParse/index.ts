import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeStringify from 'rehype-stringify'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import DOMPurify from 'dompurify'
import { katexConfig } from '@element-ai/constants'
import { remarkATargetBlank, remarkSubSuper } from './models'

export interface ProcessMarkdownOptions {
  onError?: (error: Error) => void
}

export const defaultCustomPlugins = [
  {
    key: 'remark-math',
    plugin: remarkMath,
  },
  {
    key: 'remark-a-target-blank',
    plugin: remarkATargetBlank,
  },
  //   {
  //     key: "remark-custom-mermaid",
  //     plugin: remarkCustomMermaid,
  //   },
  //   {
  //     key: "remark-custom-highlight",
  //     plugin: remarkCustomHighlight,
  //   },
  //   {
  //     key: "remark-custom-mark-highlight",
  //     plugin: remarkCustomMarkHighlight,
  //   },
  {
    key: 'remark-custom-sub-super',
    plugin: remarkSubSuper,
  },
  //   {
  //     key: "remark-custom-abbr",
  //     plugin: remarkCustomAbbr,
  //   },
  {
    key: 'remark-rehype',
    plugin: remarkRehype,
    options: { allowDangerousHtml: true },
  },
  {
    key: 'rehype-katex',
    plugin: rehypeKatex,
    options: katexConfig,
  },
]

export const createMarkdownProcessor = (middlewarePlugins: any[]) => {
  const baseProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm, {
      singleTilde: false, // 关闭单波浪线的删除线语法
    })
    .use(remarkBreaks)
  middlewarePlugins.forEach((item) => {
    baseProcessor.use(item.plugin, item.options)
  })
  const processor = baseProcessor.use(rehypeStringify, {
    allowDangerousHtml: true,
  })
  return async (content: string, options: ProcessMarkdownOptions) => {
    const { onError } = options || {}
    try {
      // 预处理：转换 LaTeX 格式
      // const processedContent = latexPreProcessContent(content);
      const result = await processor.process(content)
      return DOMPurify.sanitize(result.toString(), {
        ADD_ATTR: ['target'],
      })
    } catch (error: any) {
      onError?.(error)
      return `<div class="error">处理错误: ${error.message}</div>`
    }
  }
}
