import { MAX_SCALE, MIN_SCALE, ZOOM_SPEED } from '@element-ai-vue/constants'
import { ref, ShallowRef } from 'vue'

export const useWheelZoom = (
  previewRef: Readonly<ShallowRef<HTMLElement | null>>
) => {
  const scale = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)

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
  }
}
