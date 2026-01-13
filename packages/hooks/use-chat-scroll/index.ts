import { useScroll, useEventListener, useMutationObserver } from '@vueuse/core'
import { throttle } from 'lodash-es'
import { nextTick, ref, Ref, watch } from 'vue'

interface ChatScrollOptions {
  backButtonThreshold?: number
  bottomThreshold?: number
}

export const useChatScroll = (
  scrollContentRef: Ref<HTMLElement | null>,
  resizeContentRef: Ref<HTMLElement | null>,
  options?: ChatScrollOptions
) => {
  const { bottomThreshold = 20, backButtonThreshold = 80 } = options || {}

  const scrollInfo = useScroll(scrollContentRef, {
    behavior: 'smooth',
    offset: {
      bottom: bottomThreshold,
    },
  })
  const { arrivedState, y } = scrollInfo
  /** 是否停止自动滚动 */
  const stopAutoScroll = ref(false)
  /** 是否显示滚动到底部的按钮 */
  const hiddenBackButton = ref(true)

  let touchStartY = 0
  let touchStartTime = 0

  // 取消自动滚动
  function cacleAutoScroll() {
    if (!arrivedState.bottom) {
      stopAutoScroll.value = true
    }
  }

  function onTouchStart(e: TouchEvent) {
    touchStartY = e.touches[0].clientY
    touchStartTime = Date.now()
  }

  function onTouchMove(e: TouchEvent) {
    const currentY = e.touches[0].clientY
    const deltaY = touchStartY - currentY
    const deltaTime = Date.now() - touchStartTime

    // 如果向上滑动（deltaY > 0）且滑动距离超过阈值，并且不在底部，则停止自动滚动
    if (deltaY > 10 && deltaTime > 100) {
      cacleAutoScroll()
    }
  }

  useEventListener(scrollContentRef, 'wheel', cacleAutoScroll)

  /** 处理ios问题 ，在惯性滚动期间，scroll 事件可能延迟触发或在滚动停止后才触发*/
  useEventListener(scrollContentRef, 'touchstart', onTouchStart)
  useEventListener(scrollContentRef, 'touchmove', onTouchMove)

  const autoScrollToBottom = async (
    behavior: 'smooth' | 'instant' = 'instant'
  ) => {
    if (stopAutoScroll.value) return
    await nextTick()
    scrollContentRef.value?.scrollTo({
      top: scrollContentRef.value?.scrollHeight,
      behavior,
    })
  }

  /** 更新滚动到底部的按钮，是否显示 */
  const updateIsScrollToBottom = () => {
    if (scrollContentRef.value) {
      const { scrollHeight, clientHeight, scrollTop } = scrollContentRef.value
      hiddenBackButton.value =
        Math.abs(scrollHeight - clientHeight - scrollTop) <= backButtonThreshold
    }
  }

  watch(() => y.value, updateIsScrollToBottom)
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
        nextTick(() => {
          updateIsScrollToBottom()
        })
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
