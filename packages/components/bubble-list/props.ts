import { ExtractPropTypes, PropType } from 'vue'

export const bubbleListProps = {
  bottomThreshold: {
    type: Number,
    default: 30,
  },
}

export type BubbleListPropsType = PropType<
  Partial<ExtractPropTypes<typeof bubbleListProps>>
>
