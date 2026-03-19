import { ExtractPropTypes, PropType } from 'vue'

export const conversationMenuCommonProps = {
  items: {
    type: Array as PropType<ConversationMenu[]>,
    default: () => ({}),
  },
  openKeys: {
    type: Array as PropType<string[]>,
    default: () => [],
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

export interface ConversationMenu {
  key?: string
  label?: string
  disabled?: boolean
  children?: ConversationMenu[]
  [key: string]: any
}

export const conversationMenuProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  ...conversationMenuCommonProps,
}

export type ConversationMenuEmitsType = {
  (e: 'update:activeKey', value: string): void
  (e: 'update:openKeys', value: string[]): void
}

export type ConversationMenuPropsType = PropType<
  Partial<ExtractPropTypes<typeof conversationMenuProps>>
>
