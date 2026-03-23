import { ExtractPropTypes, PropType } from 'vue'

export const conversationPopoverProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
}

export type ConversationPopoverPropsType = PropType<
  Partial<ExtractPropTypes<typeof conversationPopoverProps>>
>
