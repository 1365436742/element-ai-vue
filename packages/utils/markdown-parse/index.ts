import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeStringify from 'rehype-stringify'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import DOMPurify from 'dompurify'
import { katexConfig } from '@element-ai-vue/constants'
import {
  remarkAbbr,
  remarkATargetBlank,
  remarkCodeBlockStatus,
  remarkMarkHighlight,
  remarkSubSuper,
} from './models'

export interface ProcessMarkdownOptions {
  onError?: (error: Error) => void
}

export interface MiddlewarePluginItem {
  key: string
  plugin: any
  options?: any
}

export const defaultCustomPlugins: MiddlewarePluginItem[] = [
  {
    key: 'remark-math',
    plugin: remarkMath,
  },
  {
    key: 'remark-a-target-blank',
    plugin: remarkATargetBlank,
  },
  {
    key: 'remark-mark-highlight',
    plugin: remarkMarkHighlight,
  },
  {
    key: 'remark-sub-super',
    plugin: remarkSubSuper,
  },
  {
    key: 'remark-abbr',
    plugin: remarkAbbr,
  },
  {
    key: 'remark-code-block-status',
    plugin: remarkCodeBlockStatus,
  },
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

export const createBaseProcessor = (
  middlewarePlugins: MiddlewarePluginItem[]
) => {
  const baseProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm, {
      singleTilde: false, // 关闭单波浪线的删除线语法
    })
    .use(remarkBreaks)
  middlewarePlugins.forEach((item) => {
    baseProcessor.use(item.plugin, item.options)
  })
  return baseProcessor
}

export interface MarkdownPart {
  type: 'html' | 'code'
  content: string
  language?: string
  loading?: boolean
}

export type ProcessorType = ReturnType<typeof createBaseProcessor>

export const processMarkdownToParts = async (
  content: string,
  processor: ProcessorType
): Promise<MarkdownPart[]> => {
  const tree = (await processor.run(processor.parse(content), {
    value: content,
  } as any)) as any
  const parts: MarkdownPart[] = []
  let currentHtmlNodes: any[] = []
  const flushHtml = () => {
    if (currentHtmlNodes.length > 0) {
      const root = { type: 'root', children: currentHtmlNodes, data: tree.data }
      const html = unified()
        .use(rehypeStringify, { allowDangerousHtml: true })
        .stringify(root as any)
      parts.push({
        type: 'html',
        content: DOMPurify.sanitize(html, {
          ADD_ATTR: ['target'],
        }),
      })
      currentHtmlNodes = []
    }
  }
  if (tree.children) {
    for (const node of tree.children) {
      let codeNode: any = null
      if (node.type === 'element' && node.tagName === 'pre') {
        codeNode = node.children.find(
          (c: any) => c.type === 'element' && c.tagName === 'code'
        )
      }

      if (codeNode) {
        flushHtml()

        let language = ''
        const className = codeNode.properties?.className
        if (Array.isArray(className)) {
          const langClass = className.find((c: any) =>
            String(c).startsWith('language-')
          )
          if (langClass) {
            language = String(langClass).replace('language-', '')
          }
        }

        const codeContent = codeNode.children
          .map((c: any) => c.value || '')
          .join('')

        const loading = !!codeNode.properties?.loading

        parts.push({ type: 'code', content: codeContent, language, loading })
      } else {
        currentHtmlNodes.push(node)
      }
    }
  }
  flushHtml()
  return parts
}
