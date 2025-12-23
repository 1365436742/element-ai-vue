import { MAX_SCALE, MIN_SCALE, ZOOM_SPEED } from '@element-ai-vue/constants'
import { computed, ComputedRef, ref, ShallowRef } from 'vue'

export const useWheelZoom = (
  previewRef: Readonly<ShallowRef<HTMLElement | null>>,
  props: {
    disabledWheelZoom?: boolean
    disabledFullscreenWheelZoom?: boolean
  } = {},
  isFullscreen: ComputedRef<boolean>
) => {
  const scale = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)
  const isDisabledOp = computed(() => {
    return (
      (props.disabledWheelZoom && !isFullscreen.value) ||
      (props.disabledFullscreenWheelZoom && isFullscreen.value)
    )
  })

  const zoomIn = () => {
    scale.value = Math.min(scale.value + ZOOM_SPEED, MAX_SCALE)
  }

  const zoomOut = () => {
    scale.value = Math.max(scale.value - ZOOM_SPEED, MIN_SCALE)
  }

  const resetZoom = () => {
    scale.value = 1
    translateX.value = 0
    translateY.value = 0
  }

  const onWheel = (e: WheelEvent) => {
    if (isDisabledOp.value) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, scale.value + delta)
    )

    // Calculate mouse position relative to the container
    if (previewRef.value) {
      const rect = previewRef.value.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Adjust translation to zoom towards mouse (center center origin)
      const ratio = newScale / scale.value
      const centerX = rect.width / 2 + translateX.value
      const centerY = rect.height / 2 + translateY.value

      translateX.value += (mouseX - centerX) * (1 - ratio)
      translateY.value += (mouseY - centerY) * (1 - ratio)
    }

    scale.value = newScale
  }

  const onMouseDown = (e: MouseEvent) => {
    if (isDisabledOp.value) return
    const startX = e.clientX
    const startY = e.clientY
    const initialTranslateX = translateX.value
    const initialTranslateY = translateY.value
    const element = previewRef.value

    const onMouseMove = (moveEvent: MouseEvent) => {
      translateX.value = initialTranslateX + (moveEvent.clientX - startX)
      translateY.value = initialTranslateY + (moveEvent.clientY - startY)
    }

    const stopDrag = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', stopDrag)
      if (element) {
        element.removeEventListener('mouseleave', stopDrag)
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stopDrag)
    if (element) {
      element.addEventListener('mouseleave', stopDrag)
    }
  }

  const onTouchStart = (e: TouchEvent) => {
    if (isDisabledOp.value) return

    if (e.touches.length === 1) {
      e.preventDefault()
      const touch = e.touches[0]
      const startX = touch.clientX
      const startY = touch.clientY
      const initialTranslateX = translateX.value
      const initialTranslateY = translateY.value

      const onTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length !== 1) return
        const moveTouch = moveEvent.touches[0]
        translateX.value = initialTranslateX + (moveTouch.clientX - startX)
        translateY.value = initialTranslateY + (moveTouch.clientY - startY)
      }

      const stopDrag = () => {
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('touchend', stopDrag)
      }

      window.addEventListener('touchmove', onTouchMove)
      window.addEventListener('touchend', stopDrag)
    } else if (e.touches.length === 2) {
      e.preventDefault()

      const getDistance = (t1: Touch, t2: Touch) => {
        const dx = t1.clientX - t2.clientX
        const dy = t1.clientY - t2.clientY
        return Math.hypot(dx, dy)
      }

      let lastDistance = getDistance(e.touches[0], e.touches[1])

      const onTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length !== 2) return
        moveEvent.preventDefault()

        const newDistance = getDistance(
          moveEvent.touches[0],
          moveEvent.touches[1]
        )
        const distanceRatio = newDistance / lastDistance
        const newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, scale.value * distanceRatio)
        )

        if (previewRef.value) {
          const rect = previewRef.value.getBoundingClientRect()
          const center = {
            x:
              (moveEvent.touches[0].clientX + moveEvent.touches[1].clientX) / 2,
            y:
              (moveEvent.touches[0].clientY + moveEvent.touches[1].clientY) / 2,
          }
          const mouseX = center.x - rect.left
          const mouseY = center.y - rect.top

          const effectiveRatio = newScale / scale.value
          const centerX = rect.width / 2 + translateX.value
          const centerY = rect.height / 2 + translateY.value

          translateX.value += (mouseX - centerX) * (1 - effectiveRatio)
          translateY.value += (mouseY - centerY) * (1 - effectiveRatio)
        }

        scale.value = newScale
        lastDistance = newDistance
      }

      const stopZoom = () => {
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('touchend', stopZoom)
      }

      window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('touchend', stopZoom)
    }
  }

  return {
    scale,
    translateX,
    translateY,
    previewRef,
    zoomIn,
    zoomOut,
    resetZoom,
    onWheel,
    onMouseDown,
    onTouchStart,
  }
}
