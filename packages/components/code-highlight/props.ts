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
  expanded: {
    type: Boolean,
    default: undefined,
  },
  showLineNumbers: {
    type: Boolean,
    default: false,
  },
}

export type CodeHighlightEmitsType = {
  (e: 'update:expanded', value: boolean): void
}

export type CodeHighlightPropsType = PropType<
  Partial<ExtractPropTypes<typeof codeHighlightProps>>
>
