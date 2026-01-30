import { useScroll, useEventListener, useMutationObserver } from '@vueuse/core'
import { throttle } from 'lodash-es'
import { computed, ref, Ref, watch } from 'vue'

interface ChatScrollOptions {
  bottomThreshold?: number
}

export const useChatScroll = (
  scrollContentRef: Ref<HTMLElement | null>,
  resizeContentRef: Ref<HTMLElement | null>,
  options?: ChatScrollOptions
) => {
  const { bottomThreshold = 30 } = options || {}

  const scrollInfo = useScroll(scrollContentRef, {
    behavior: 'smooth',
    offset: {
      bottom: bottomThreshold,
    },
  })
  const { arrivedState } = scrollInfo
  /** 是否停止自动滚动 */
  const stopAutoScroll = ref(false)
  /** 是否显示滚动到底部的按钮 */
  const hiddenBackButton = computed(() => arrivedState.bottom)
  /** 控制，如果smooth在滚动中。不要立刻滚动，等滚动结束后再滚动 */
  // @ts-ignore
  let _smoothLoading = false

  // 取消自动滚动
  function cacleAutoScroll() {
    stopAutoScroll.value = true
  }

  useEventListener(scrollContentRef, 'wheel', cacleAutoScroll)
  /** 处理ios问题 ，在惯性滚动期间，scroll 事件可能延迟触发或在滚动停止后才触发*/
  useEventListener(scrollContentRef, 'touchmove', cacleAutoScroll)

  const autoScrollToBottom = async (
    behavior: 'smooth' | 'instant' = 'instant'
  ) => {
    if (stopAutoScroll.value) return
    if (behavior === 'smooth') {
      _smoothLoading = true
    }
    scrollContentRef.value?.scrollTo({
      top: scrollContentRef.value?.scrollHeight,
      behavior,
    })
    setTimeout(() => {
      _smoothLoading = false
    }, 200)
  }

  watch(
    () => arrivedState.bottom,
    () => {
      if (arrivedState.bottom) {
        stopAutoScroll.value = false
      }
    }
  )

  useMutationObserver(
    resizeContentRef,
    throttle(
      () => {
        if (stopAutoScroll.value) return
        autoScrollToBottom()
      },
      100,
      {
        trailing: true,
        leading: true,
      }
    ),
    {
      attributes: true,
      childList: true,
      subtree: true,
    }
  )

  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'instant') => {
    stopAutoScroll.value = false
    autoScrollToBottom(behavior)
  }

  const scrollToTop = (behavior: 'smooth' | 'instant' = 'instant') => {
    stopAutoScroll.value = true
    scrollContentRef.value?.scrollTo({
      top: 0,
      behavior,
    })
  }

  const scrollToIndex = (
    index: number,
    behavior: 'smooth' | 'instant' = 'instant'
  ) => {
    stopAutoScroll.value = true
    if (!resizeContentRef.value || !scrollContentRef.value) return
    const targetElement = resizeContentRef.value?.children[index] as HTMLElement
    if (targetElement) {
      const offsetTop = targetElement.offsetTop
      scrollContentRef.value.scrollTo({
        top: offsetTop,
        behavior,
      })
    }
  }

  return {
    stopAutoScroll,
    hiddenBackButton,
    scrollInfo,
    scrollToBottom,
    scrollToTop,
    scrollToIndex,
  }
}
