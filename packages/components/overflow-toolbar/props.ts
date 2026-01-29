import { ExtractPropTypes, PropType } from 'vue'

export const overflowToolbarProps = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
  list: {
    type: Array,
    default: () => [],
  },
}

export type OverflowToolbarPropsType = PropType<
  Partial<ExtractPropTypes<typeof overflowToolbarProps>>
>
