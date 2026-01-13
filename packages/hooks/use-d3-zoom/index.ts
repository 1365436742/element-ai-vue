import { ref, type Ref, onUnmounted } from 'vue'
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom'
import { select, type Selection } from 'd3-selection'
import { MAX_SCALE, MIN_SCALE } from '@element-ai-vue/constants'

/**
 * 禁止缩放类型
 * wheel: 禁止滚轮缩放
 * fullscreenWheel: 全屏状态下禁止滚轮缩放
 * clickMove: 禁止点击拖拽缩放
 * fullscreenClickMove: 全屏状态下禁止点击拖拽缩放
 * all: 全部禁止
 */
export type DisabledZoom = (
  | 'wheel'
  | 'fullscreenWheel'
  | 'clickMove'
  | 'fullscreenClickMove'
  | 'all'
)[]

export const useD3Zoom = (
  previewRef: Ref<HTMLElement | null>,
  props: {
    disabledZoom?: DisabledZoom
  },
  isFullscreen: Ref<boolean>
) => {
  const scale = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)

  let d3Zoom: ZoomBehavior<HTMLElement, unknown> | null = null
  let d3Selection: Selection<HTMLElement, unknown, null, undefined> | null =
    null

  const initZoom = () => {
    if (!previewRef.value) return

    d3Selection = select(previewRef.value)
    d3Zoom = zoom<HTMLElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .filter((event: any) => {
        if (props.disabledZoom?.includes('all')) return false
        if (
          props.disabledZoom?.includes('fullscreenWheel') &&
          isFullscreen.value &&
          event.type === 'wheel'
        )
          return false
        if (
          props.disabledZoom?.includes('wheel') &&
          !isFullscreen.value &&
          event.type === 'wheel'
        )
          return false
        if (
          props.disabledZoom?.includes('fullscreenClickMove') &&
          isFullscreen.value &&
          (event.type === 'mousedown' || event.type === 'touchstart')
        )
          return false
        if (
          props.disabledZoom?.includes('clickMove') &&
          !isFullscreen.value &&
          (event.type === 'mousedown' || event.type === 'touchstart')
        )
          return false
        return !event.ctrlKey && !event.button
      })
      .touchable(true)
      .on('zoom', (event) => {
        translateX.value = event.transform.x
        translateY.value = event.transform.y
        scale.value = event.transform.k
      })

    d3Selection.call(d3Zoom).on('dblclick.zoom', null)
  }

  const zoomIn = () => {
    d3Selection?.transition().call(d3Zoom!.scaleBy, 1.2)
  }

  const zoomOut = () => {
    d3Selection?.transition().call(d3Zoom!.scaleBy, 0.8)
  }

  const resetZoom = () => {
    d3Selection
      ?.transition()
      .duration(750)
      .call(d3Zoom!.transform, zoomIdentity)
  }

  const destroyZoom = () => {
    if (d3Selection) {
      d3Selection.on('.zoom', null)
      d3Selection = null
      d3Zoom = null
    }
  }

  onUnmounted(() => {
    destroyZoom()
  })

  return {
    scale,
    translateX,
    translateY,
    initZoom,
    zoomIn,
    zoomOut,
    resetZoom,
  }
}
