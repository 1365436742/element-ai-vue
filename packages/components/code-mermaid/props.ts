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
}
export type CodeMermaidPropsType = PropType<
  ExtractPropTypes<typeof codeMermaidtProps>
>
