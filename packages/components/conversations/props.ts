import { ExtractPropTypes, PropType } from 'vue'

export const conversationPopoverProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  collapse: {
    type: Boolean,
    default: false,
  },
}

export type ConversatioPopoverEmitsType = {
  (e: 'update:collapse', value: boolean): void
}

export type ConversationPopoverPropsType = PropType<
  Partial<ExtractPropTypes<typeof conversationPopoverProps>>
>
