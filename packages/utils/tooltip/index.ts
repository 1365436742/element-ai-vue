/**
 * Tooltip Manager - 确保同一时刻只有一个 tooltip 显示
 */

type TooltipInstance = {
  hide: () => void
}

let activeTooltip: TooltipInstance | null = null

/**
 * 注册当前活动的 tooltip 实例
 * 如果已有活动的 tooltip，会先关闭它
 */
export const registerActiveTooltip = (instance: TooltipInstance) => {
  if (activeTooltip && activeTooltip !== instance) {
    activeTooltip.hide()
  }
  activeTooltip = instance
}

/**
 * 取消注册 tooltip 实例
 */
export const unregisterActiveTooltip = (instance: TooltipInstance) => {
  if (activeTooltip === instance) {
    activeTooltip = null
  }
}

/**
 * 关闭当前活动的 tooltip
 */
export const hideActiveTooltip = () => {
  if (activeTooltip) {
    activeTooltip.hide()
    activeTooltip = null
  }
}
