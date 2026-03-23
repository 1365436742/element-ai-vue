import { ExtractPropTypes, PropType } from 'vue'

export const conversationsProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  hasMore: {
    type: Boolean,
    default: false,
  },
  onNext: {
    type: Function,
  },
}

export interface CoversationShortcutKeys {
  conversationCreate?: string[]
}

export type ConversationsPropsType = PropType<
  Partial<ExtractPropTypes<typeof conversationsProps>>
>
