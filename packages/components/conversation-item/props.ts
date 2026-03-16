import { ExtractPropTypes, PropType, VNode } from 'vue'

export const conversationItemCommonProps = {
  items: {
    type: Array as PropType<ConversationItem[]>,
    default: () => ({}),
  },
  keyName: {
    type: String,
    default: 'key',
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
  icon?: string
  label?: string
  group?: string
  disabled?: boolean

  // dividerLine?: boolean
  // dashed?: boolean

  [key: string]: any
}

export type CoversationItemSlotsType = {
  icon?: (item: ConversationItem) => VNode[]
  item?: (item: ConversationItem) => VNode[]
  group?: (groupName: string) => VNode[]
}

export type CoversationItemEmitsType = {
  (e: 'update:activeKey', value: string): void
  (e: 'activeChange', value: string, item: ConversationItem): void
}

export type ConversationItemPropsType = PropType<
  Partial<ExtractPropTypes<typeof conversationItemProps>>
>
