import { ExtractPropTypes, PropType } from 'vue'
export interface ThoughtChainItem {
  key?: string | number
  title: string
  icon?: string
  description?: string
  extended?: boolean
  hiddenLine?: boolean
  [key: string]: any
}

export const thoughtChainProps = {
  list: {
    type: Array as PropType<ThoughtChainItem[]>,
    default: () => [],
  },
}

export type ThoughtChainPropsType = PropType<
  Partial<ExtractPropTypes<typeof thoughtChainProps>>
>
