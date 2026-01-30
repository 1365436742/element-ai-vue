import type { Placement } from '@floating-ui/vue'
import type { ExtractPropTypes, PropType } from 'vue'

export type PopoverTrigger = 'hover' | 'click' | 'focus' | 'manual'
export type PopoverEffect = 'dark' | 'light'

export const popoverProps = {
  /**
   * @description popover content
   */
  content: {
    type: String,
    default: '',
  },
  /**
   * @description popover placement
   */
  placement: {
    type: String as PropType<Placement>,
    default: 'top' as Placement,
  },
  /**
   * @description popover trigger mode
   */
  trigger: {
    type: String as PropType<PopoverTrigger>,
    default: 'click' as PopoverTrigger,
  },
  /**
   * @description popover theme effect
   */
  effect: {
    type: String as PropType<PopoverEffect>,
    default: 'light' as PopoverEffect,
  },
  /**
   * @description whether popover is disabled
   */
  disabled: {
    type: Boolean,
    default: false,
  },
  /**
   * @description offset distance from reference element
   */
  offset: {
    type: Number,
    default: 12,
  },
  /**
   * @description delay before showing popover (ms)
   */
  showAfter: {
    type: Number,
    default: 0,
  },
  /**
   * @description delay before hiding popover (ms)
   */
  hideAfter: {
    type: Number,
    default: 200,
  },
  /**
   * @description manual control visibility
   */
  visible: {
    type: Boolean,
    default: undefined,
  },
  /**
   * @description popover width
   */
  width: {
    type: [String, Number] as PropType<string | number>,
    default: 150,
  },
  /**
   * @description whether to show arrow
   */
  showArrow: {
    type: Boolean,
    default: true,
  },
  /**
   * @description teleport target, can be a CSS selector or HTMLElement
   */
  teleportTo: {
    type: [String, Object] as PropType<string | HTMLElement>,
    default: 'body',
  },
  /**
   * @description whether close on click outside
   */
  closeOnClickOutside: {
    type: Boolean,
    default: true,
  },
  /**
   * @description whether close when pressing escape key
   */
  closeOnPressEscape: {
    type: Boolean,
    default: true,
  },
}

export const popoverEmits = {
  'update:visible': (val: boolean) => typeof val === 'boolean',
  show: () => true,
  hide: () => true,
  'before-enter': () => true,
  'before-leave': () => true,
  'after-enter': () => true,
  'after-leave': () => true,
}

export type PopoverProps = ExtractPropTypes<typeof popoverProps>
export type PopoverEmits = typeof popoverEmits
