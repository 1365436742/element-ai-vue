import { ExtractPropTypes, PropType } from 'vue'

export const textOverflowTooltipProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  content: {
    type: String,
    default: '',
  },
}

export type TextOverflowTooltipPropsType = PropType<
  Partial<ExtractPropTypes<typeof textOverflowTooltipProps>>
>
