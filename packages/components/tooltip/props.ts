import type { Placement } from '@floating-ui/vue'
import type { ExtractPropTypes, PropType } from 'vue'

export type TooltipTrigger = 'hover' | 'click' | 'focus' | 'manual'
export type TooltipEffect = 'dark' | 'light'

export const tooltipProps = {
  /**
   * @description tooltip content
   */
  content: {
    type: String,
    default: '',
  },
  /**
   * @description tooltip placement
   */
  placement: {
    type: String as PropType<Placement>,
    default: 'top' as Placement,
  },
  /**
   * @description tooltip trigger mode
   */
  trigger: {
    type: String as PropType<TooltipTrigger>,
    default: 'hover' as TooltipTrigger,
  },
  /**
   * @description tooltip theme effect
   */
  effect: {
    type: String as PropType<TooltipEffect>,
    default: 'dark' as TooltipEffect,
  },
  /**
   * @description whether tooltip is disabled
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
    default: 8,
  },
  /**
   * @description delay before showing tooltip (ms)
   */
  showAfter: {
    type: Number,
    default: 0,
  },
  /**
   * @description delay before hiding tooltip (ms)
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
   * @description teleport target, can be a CSS selector or HTMLElement
   */
  teleportTo: {
    type: [String, Object] as PropType<string | HTMLElement>,
    default: 'body',
  },
}

export const tooltipEmits = {
  'update:visible': (val: boolean) => typeof val === 'boolean',
  show: () => true,
  hide: () => true,
}

export type TooltipProps = ExtractPropTypes<typeof tooltipProps>
export type TooltipEmits = typeof tooltipEmits
