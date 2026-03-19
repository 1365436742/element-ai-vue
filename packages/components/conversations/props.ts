import { ExtractPropTypes, PropType, VNode } from 'vue'
import {
  ConversationItem,
  conversationItemCommonProps,
  CoversationItemEmitsType,
} from '../conversation-item'
import {
  conversationMenuCommonProps,
  ConversationMenuEmitsType,
} from '../conversation-menu'
import { ConversationCreateEmitsType } from '../conversation-create'

export const conversationsProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  ...conversationItemCommonProps,
  ...conversationMenuCommonProps,
  shortcutKeys: {
    type: Object as PropType<CoversationShortcutKeys>,
    default: () => ({}),
  },
  hasMore: {
    type: Boolean,
    default: false,
  },
}

export interface CoversationShortcutKeys {
  conversationCreate?: string[]
}

export type CoversationsSlotsType = {
  header?: () => VNode[]
  footer?: () => VNode[]

  divider?: (item: ConversationItem) => VNode[]

  conversationCreate?: () => VNode[]

  loader?: () => VNode[]
}

export type ConversationsEmitsType = {
  (e: 'next'): void
} & CoversationItemEmitsType &
  ConversationMenuEmitsType &
  ConversationCreateEmitsType

export type ConversationsPropsType = PropType<
  Partial<ExtractPropTypes<typeof conversationsProps>>
>
