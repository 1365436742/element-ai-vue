import { useMediaQuery } from '@vueuse/core'

/**
 * 检测设备相关信息的 Hook
 */
export const useDevice = () => {
  // 宽度是否是移动端设备
  const isMobileWidth = useMediaQuery('(max-width: 768px)')

  // pointer: coarse 表示主要输入设备是粗糙的（通常指手指触摸）
  const isTouchDevice = useMediaQuery('(pointer: coarse)')

  return {
    isMobileWidth,
    isTouchDevice,
  }
}
