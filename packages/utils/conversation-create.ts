import { useMagicKeys, whenever } from '@vueuse/core'
import { onUnmounted } from 'vue'

type HotkeyCallback = (key: string) => void

interface HotkeyConfig {
  keys: string[]
  callback: HotkeyCallback
}

export function useHotkeys(configs: HotkeyConfig[]) {
  const magicKeys = useMagicKeys()
  const stopHandlers: (() => void)[] = []

  configs.forEach(({ keys, callback }) => {
    keys.forEach((key) => {
      const keyRef = magicKeys[key]
      if (!keyRef) {
        console.warn(`[useHotkeys] 未找到键位: ${key}`)
        return
      }

      const stop = whenever(keyRef, () => callback(key))
      stopHandlers.push(stop)
    })
  })

  // 组件卸载时自动清理
  onUnmounted(() => {
    stopHandlers.forEach((stop) => stop())
  })

  return {
    stop: () => stopHandlers.forEach((fn) => fn()),
  }
}
