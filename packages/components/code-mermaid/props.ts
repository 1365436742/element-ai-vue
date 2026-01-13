import { DisabledZoom } from '@element-ai-vue/hooks'
import { MermaidConfig } from 'mermaid'
import { ExtractPropTypes, PropType } from 'vue'

export const codeMermaidtProps = {
  fullscreenMode: {
    type: String as PropType<'web' | 'page'>,
    default: 'page',
  },
  mermaidConfig: {
    type: Object as PropType<MermaidConfig>,
    default: () => ({}),
  },
  disabledZoom: {
    type: Array as PropType<DisabledZoom>,
    default: () => [],
  },
}
export type CodeMermaidPropsType = PropType<
  Partial<ExtractPropTypes<typeof codeMermaidtProps>>
>
