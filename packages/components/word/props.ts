import { ExtractPropTypes, PropType } from 'vue'

export const wordProps = {
  theme: {
    type: String as PropType<'light' | 'dark'>,
    default: 'light',
  },
}

export type WordPropsType = PropType<
  Partial<ExtractPropTypes<typeof wordProps>>
>
