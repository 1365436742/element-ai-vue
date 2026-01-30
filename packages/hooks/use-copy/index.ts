import { ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'
import copy from 'copy-to-clipboard'

export const useCopy = () => {
  const isCopied = ref(false)

  const { start } = useTimeoutFn(
    () => {
      isCopied.value = false
    },
    1000,
    { immediate: false }
  )

  const onCopy = (content: string) => {
    if (isCopied.value) return
    copy(content)
    isCopied.value = true
    start()
  }
  return {
    isCopied,
    onCopy,
  }
}
