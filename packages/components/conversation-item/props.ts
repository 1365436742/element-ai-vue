import { ExtractPropTypes, PropType } from 'vue'

export const conversationItemCommonProps = {
  items: {
    type: Array as PropType<ConversationItem[]>,
    default: () => ({}),
  },
  keyName: {
    type: String,
    default: 'key',
  },
  sticky: {
    type: Boolean,
    default: false,
  },
  activeKey: {
    type: String,
    default: '',
  },
}

export const conversationItemProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  ...conversationItemCommonProps,
}

export interface ConversationItem {
  key?: string
  label?: string
  group?: string
  disabled?: boolean
  [key: string]: any
}

export type CoversationItemEmitsType = {
  (e: 'update:activeKey', value: string): void
  (e: 'activeChange', value: string, item: ConversationItem): void
}

export type ConversationItemPropsType = PropType<
  Partial<ExtractPropTypes<typeof conversationItemProps>>
>
