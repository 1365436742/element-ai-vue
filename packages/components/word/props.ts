import { ExtractPropTypes, PropType } from 'vue'
import { baseWordInputProps } from './base-word-input/props'

export const wordProps = {
  ...baseWordInputProps,
  theme: {
    type: String as PropType<'light' | 'dark'>,
    default: '',
  },
}

export type WordPropsType = PropType<
  Partial<ExtractPropTypes<typeof wordProps>>
>
