import { ExtractPropTypes, PropType } from 'vue'
import { baseInputProps } from './base-input/props'

export interface MentionConfigItem {
  prefix: string
  component: any
  options: { label: string; value: string; [key: string]: any }[]
  [key: string]: any
}

export const senderProps = {
  ...baseInputProps,
  mentionConfig: {
    type: Object as PropType<MentionConfigItem[]>,
    default: () => ({}),
  },
  variant: {
    type: String as PropType<'default' | 'updown'>,
    default: 'default',
  },
}
export type SenderEmitsType = {
  (e: 'send', content: string): void
}

export type SenderPropsType = PropType<
  Partial<ExtractPropTypes<typeof senderProps>>
>
