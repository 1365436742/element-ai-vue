<template>
  <div :class="[ns.b(), isFullscreen ? ns.e('fullscreen') : '']">
    <slot v-if="isFullscreen" name="fullscreen-toolbar" v-bind="slotParams">
      <div :class="ns.em('fullscreen', 'toolbar')">
        <div :class="ns.em('fullscreen', 'action-group')">
          <div
            :class="ns.em('fullscreen', 'action-download')"
            @click="downloadPng"
          >
            <span class="element-ai-vue-iconfont icon-xiazai"></span>
            下载图片
          </div>
        </div>
        <div :class="ns.em('fullscreen', 'action-other')">
          <span
            class="element-ai-vue-iconfont icon-suoxiao"
            :class="ns.em('toolbar', 'item')"
            @click="zoomOut"
          ></span>
          <span
            class="element-ai-vue-iconfont icon-fangda"
            :class="ns.em('toolbar', 'item')"
            @click="zoomIn"
          ></span>
          <span
            class="element-ai-vue-iconfont icon-shiyingyemian"
            :class="ns.em('toolbar', 'item')"
            @click="resetZoom"
          ></span>
          <span
            class="element-ai-vue-iconfont icon-guanbi"
            :class="ns.em('toolbar', 'item')"
            @click="toggleFullscreen"
          ></span>
        </div>
      </div>
    </slot>
    <slot v-else name="toolbar" v-bind="slotParams">
      <div :class="ns.e('toolbar')">
        <template v-if="!isCodeView">
          <span
            class="element-ai-vue-iconfont icon-xiazai"
            :class="ns.em('toolbar', 'item')"
            @click="downloadPng"
          ></span>
          <span
            class="element-ai-vue-iconfont icon-suoxiao"
            :class="ns.em('toolbar', 'item')"
            @click="zoomOut"
          ></span>
          <span
            class="element-ai-vue-iconfont icon-fangda"
            :class="ns.em('toolbar', 'item')"
            @click="zoomIn"
          ></span>
          <span
            class="element-ai-vue-iconfont icon-shiyingyemian"
            :class="ns.em('toolbar', 'item')"
            @click="resetZoom"
          ></span>
          <span
            class="element-ai-vue-iconfont icon-quanping"
            :class="ns.em('toolbar', 'item')"
            @click="toggleFullscreen"
          ></span>
          <div :class="ns.em('toolbar', 'item')" @click="toggleView">
            查看代码
          </div>
        </template>
        <template v-else>
          <span
            :class="[
              'element-ai-vue-iconfont',
              ns.em('toolbar', 'item'),
              isCopied ? 'icon-duihao1' : 'icon-fuzhi',
            ]"
            @click="onCopy"
          ></span>
          <div :class="ns.em('toolbar', 'item')" @click="toggleView">预览</div>
        </template>
      </div>
    </slot>
    <div
      v-show="!isCodeView"
      ref="previewRef"
      :class="ns.e('preview')"
      @wheel.prevent="onWheel"
      @mousedown="onMouseDown"
    >
      <div
        :style="{
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin: 'center center',
        }"
        :class="[ns.em('preview', 'mermaid-svg-container')]"
        v-html="htmlContent"
      ></div>
    </div>
    <div v-show="isCodeView" :class="ns.e('code')">
      <ElACodeHighlight
        :content="content"
        language="mermaid"
        :theme="theme === 'dark' ? 'github-dark' : 'github-light'"
      >
        <template #header>
          <div></div>
        </template>
      </ElACodeHighlight>
    </div>
  </div>
</template>

<script setup lang="ts">
import mermaid, { MermaidConfig } from 'mermaid'
import {
  computed,
  nextTick,
  onMounted,
  PropType,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import { useFullscreen } from '@vueuse/core'
import { useCopy, useNamespace, useWheelZoom } from '@element-ai-vue/hooks'
import { downloadPngBySvgElement } from '@element-ai-vue/utils'
import { debounce } from 'lodash-es'
import ElACodeHighlight from '../code-highlight/index.vue'
import { codeMermaidtProps } from './props'

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  theme: {
    type: String as PropType<MermaidConfig['theme']>,
    default: 'base',
  },
  ...codeMermaidtProps,
})
defineOptions({
  name: 'ElACodeMermaid',
})

const ns = useNamespace('code-mermaid')
const previewRef = useTemplateRef<HTMLElement>('previewRef')
const { isCopied, onCopy: copyContent } = useCopy()
const {
  scale,
  translateX,
  translateY,
  zoomIn,
  zoomOut,
  resetZoom,
  onWheel,
  onMouseDown,
} = useWheelZoom(previewRef)
const pageIsFullscreen = ref(false)
const { isFullscreen: webIsFullscreen, toggle } = useFullscreen()
const htmlContent = ref('')
const isCodeView = ref(false)

const isFullscreen = computed(() => {
  if (props.fullscreenMode === 'web') {
    return webIsFullscreen.value
  } else {
    return pageIsFullscreen.value
  }
})

const config = computed(() => {
  return {
    startOnLoad: false,
    ...props.mermaidConfig,
    theme: props.theme,
  }
})
mermaid.initialize(config.value)
onMounted(() => {
  render()
})
const render = async () => {
  if (!props.content) return
  try {
    const { svg } = await mermaid.render(`mermaid-${Date.now()}`, props.content)
    htmlContent.value = svg
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Mermaid rendering failed:', error)
  }
}

const toggleFullscreen = () => {
  if (props.fullscreenMode === 'web') {
    toggle()
  } else {
    pageIsFullscreen.value = !pageIsFullscreen.value
  }
  nextTick(() => {
    render()
  })
}

const onCopy = () => {
  copyContent(props.content)
}

const toggleView = () => {
  isCodeView.value = !isCodeView.value
}

const downloadPng = debounce(
  () => {
    if (!previewRef.value) return
    const svgElement = previewRef.value.querySelector('svg')
    if (!svgElement) return
    downloadPngBySvgElement(svgElement)
  },
  300,
  {
    leading: true,
  }
)

watch(isFullscreen, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

watch([() => props.content, () => props.theme], () => {
  mermaid.initialize(config.value)
  render()
})

const slotParams = computed(() => ({
  isCopied: isCopied.value,
  isCodeView: isCodeView.value,
  toggleView,
  zoomIn,
  zoomOut,
  resetZoom,
  toggleFullscreen,
  downloadPng,
  onCopy,
}))
</script>
