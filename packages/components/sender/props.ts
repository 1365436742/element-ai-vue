import { ExtractPropTypes, PropType, VNode } from 'vue'
import { baseInputProps } from './base-input/props'

export const senderProps = {
  ...baseInputProps,
  loading: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String as PropType<'default' | 'updown'>,
    default: 'default',
  },
}

export interface SenderSelectOption {
  label: string
  value: string
}

export type SenderSlotsType = {
  prefix?: () => VNode[]
  'input-tag-prefix'?: () => VNode[]
  'action-list'?: () => VNode[]
  'send-btn'?: (props: { disabled?: boolean }) => VNode[]
  'send-btn-loading'?: () => VNode[]
  'select-slot-content'?: (props: { options: SenderSelectOption[] }) => VNode[]
}

export type SenderEmitsType = {
  (e: 'send', content: string): void
  (e: 'update:loading', loading: boolean): void
}

export type SenderPropsType = PropType<
  Partial<ExtractPropTypes<typeof senderProps>>
>
