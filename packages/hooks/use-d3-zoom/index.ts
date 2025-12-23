import { ref, type Ref } from 'vue'
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom'
import { select, type Selection } from 'd3-selection'
import { MAX_SCALE, MIN_SCALE } from '@element-ai-vue/constants'

export const useD3Zoom = (previewRef: Ref<HTMLElement | null>) => {
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
