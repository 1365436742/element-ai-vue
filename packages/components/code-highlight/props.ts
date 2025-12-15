import { BundledLanguage, BundledTheme } from 'shiki'
import { ExtractPropTypes, PropType } from 'vue'

export const codeHighlightProps = {
  extendLanguages: {
    type: Array as PropType<BundledLanguage[]>,
    default: () => [],
  },
  extendThemes: {
    type: Array as PropType<BundledTheme[]>,
    default: () => [],
  },
}

export type CodeHighlightPropsType = PropType<
  ExtractPropTypes<typeof codeHighlightProps>
>
