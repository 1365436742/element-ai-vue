import { ExtractPropTypes, PropType } from 'vue'

export interface OverflowToolbarItem {
  key: string | number
  text: string
  icon?: string
  [key: string]: any
}

export const overflowToolbarProps = <
  T extends OverflowToolbarItem = OverflowToolbarItem,
>() => ({
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  list: {
    type: Array as PropType<T[]>,
    default: () => [],
  },
  trigger: {
    type: String as PropType<'click' | 'hover'>,
    default: 'click',
  },
  visiblePopover: {
    type: Boolean,
    default: undefined,
  },
  minShowNum: {
    type: Number,
    default: 0,
  },
})

export type OverflowToolbarEmits = {
  (event: 'update:visiblePopover', visible: boolean): void
}
export type OverflowToolbarPropsType = PropType<
  Partial<ExtractPropTypes<typeof overflowToolbarProps>>
>
