import { MiddlewarePluginItem } from '@element-ai-vue/utils'
import { ExtractPropTypes, PropType } from 'vue'
import { CodeHighlightPropsType } from '../code-highlight/props'
import { CodeMermaidPropsType } from '../code-mermaid/props'

export const markdownProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  content: {
    type: String,
    default: '',
  },
  remarkPlugins: {
    type: Array as PropType<MiddlewarePluginItem[]>,
    default: () => [],
  },
  codeHighlightProps: {
    type: Object as CodeHighlightPropsType,
    default: () => ({}),
  },
  codeMermaidProps: {
    type: Object as CodeMermaidPropsType,
    default: () => ({}),
  },
}

export type MarkdownPropsType = PropType<
  Partial<ExtractPropTypes<typeof markdownProps>>
>
