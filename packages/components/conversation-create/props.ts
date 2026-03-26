import { ExtractPropTypes, PropType } from 'vue'

export const conversationCreateProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  shortcutKeys: {
    type: Object as PropType<string[]>,
    default: () => [],
  },
}
export type ConversationCreateEmitsType = {
  (e: 'conversationCreateClick'): void
}
export type ConversationCreatePropsType = PropType<
  Partial<ExtractPropTypes<typeof conversationCreateProps>>
>
