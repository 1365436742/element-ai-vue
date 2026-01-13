<template>
  <Teleport to="body" :disabled="!isFullscreen">
    <div
      :class="[
        ns.b(),
        theme === 'dark' ? ns.m('dark') : '',
        isFullscreen ? ns.e('fullscreen') : '',
      ]"
    >
      <slot v-if="isFullscreen" name="fullscreen-toolbar" v-bind="slotParams">
        <div :class="ns.em('fullscreen', 'toolbar')">
          <div :class="ns.em('fullscreen', 'action-group')">
            <div
              v-if="toolMap.download"
              :class="ns.em('fullscreen', 'action-download')"
              @click="toolMap.download.action"
            >
              <span
                class="element-ai-vue-iconfont"
                :class="toolMap.download.icon"
              ></span>
              <span>{{ toolMap.download.name }}</span>
            </div>
          </div>
          <div
            :class="[
              ns.em('fullscreen', 'action-other'),
              ns.is('mobile-width', isMobileWidth),
            ]"
          >
            <div :class="ns.em('fullscreen', 'left-action')">
              <Tooltip :content="toolMap.zoomOut.name">
                <span
                  class="element-ai-vue-iconfont"
                  :class="[ns.em('toolbar', 'item'), toolMap.zoomOut.icon]"
                  @click="toolMap.zoomOut.action"
                ></span>
              </Tooltip>
              <Tooltip :content="toolMap.zoomIn.name">
                <span
                  class="element-ai-vue-iconfont"
                  :class="[ns.em('toolbar', 'item'), toolMap.zoomIn.icon]"
                  @click="toolMap.zoomIn.action"
                ></span>
              </Tooltip>
            </div>
            <div :class="ns.em('fullscreen', 'right-action')">
              <Tooltip :content="toolMap.resetZoom.name">
                <span
                  class="element-ai-vue-iconfont"
                  :class="[ns.em('toolbar', 'item'), toolMap.resetZoom.icon]"
                  @click="toolMap.resetZoom.action"
                ></span>
              </Tooltip>
              <Tooltip :content="t('el.codeMermaid.close', '关闭')">
                <span
                  class="element-ai-vue-iconfont icon-close"
                  :class="ns.em('toolbar', 'item')"
                  @click="toggleFullscreen"
                ></span>
              </Tooltip>
            </div>
          </div>
        </div>
      </slot>
      <slot v-else name="toolbar" v-bind="slotParams">
        <div :class="ns.e('toolbar')">
          <template v-if="!isCodeView">
            <Tooltip
              v-for="toolItem in Object.values(toolMap)"
              :key="toolItem.name"
              :teleport-to="tooltipRef!"
              placement="top"
              :content="toolItem.name"
            >
              <span
                class="element-ai-vue-iconfont"
                :class="[ns.em('toolbar', 'item'), toolItem.icon]"
                @click="toolItem.action"
              ></span>
            </Tooltip>
            <div :class="ns.em('toolbar', 'item')" @click="toggleView">
              {{ t('el.codeMermaid.viewCode', '查看代码') }}
            </div>
          </template>
          <template v-else>
            <span
              :class="[
                'element-ai-vue-iconfont',
                ns.em('toolbar', 'item'),
                isCopied ? 'icon-correct' : 'icon-copy',
              ]"
              @click="onCopy"
            ></span>
            <div :class="ns.em('toolbar', 'item')" @click="toggleView">
              {{ t('el.codeMermaid.preview', '预览') }}
            </div>
          </template>
        </div>
      </slot>
      <div
        v-show="!isCodeView"
        ref="previewRef"
        :class="ns.e('preview')"
        style="touch-action: none"
      >
        <div
          :style="{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: 'fit-content',
          }"
          :class="[ns.em('preview', 'mermaid-svg-container')]"
          v-html="htmlContent"
        ></div>
      </div>
      <div v-show="isCodeView" :class="ns.e('code')">
        <ElACodeHighlight :content="content" language="mermaid" :theme>
          <template #header>
            <div></div>
          </template>
        </ElACodeHighlight>
      </div>
      <div ref="tooltipRef"></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import mermaid from 'mermaid'
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
import {
  useCopy,
  useD3Zoom,
  useDevice,
  useLocale,
  useNamespace,
  useTheme,
} from '@element-ai-vue/hooks'
import { downloadPngBySvgElement } from '@element-ai-vue/utils'
import { debounce } from 'lodash-es'
import Tooltip from '../tooltip/index.vue'
import ElACodeHighlight from '../code-highlight/index.vue'
import { codeMermaidtProps } from './props'
import { CodeMermaidThemeMap } from '@element-ai-vue/constants'

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  theme: {
    type: String as PropType<'light' | 'dark'>,
    default: undefined,
  },
  ...codeMermaidtProps,
})
defineOptions({
  name: 'ElACodeMermaid',
})

const tooltipRef = useTemplateRef('tooltipRef')
const ns = useNamespace('code-mermaid')
const { isMobileWidth } = useDevice()
const { t } = useLocale()

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)

const previewRef = useTemplateRef<HTMLElement>('previewRef')
const { isCopied, onCopy: copyContent } = useCopy()

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
const { scale, translateX, translateY, initZoom, zoomIn, zoomOut, resetZoom } =
  useD3Zoom(previewRef, props, isFullscreen)

const config = computed(() => {
  return {
    startOnLoad: false,
    securityLevel: 'loose' as 'loose' | 'strict' | 'antiscript' | 'sandbox',
    suppressErrorRendering: true,
    theme: CodeMermaidThemeMap[theme.value || 'base'],
    ...props.mermaidConfig,
  }
})

onMounted(() => {
  initZoom()
  render()
})

const render = async () => {
  if (!props.content) return
  mermaid.initialize({
    ...config.value,
  })
  try {
    const isValid = await mermaid.parse(props.content)
    if (!isValid) {
      return
    }
    const { svg } = await mermaid.render(`mermaid-${Date.now()}`, props.content)
    htmlContent.value = svg
  } catch (error) {}
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
const debounceDwonloadPng = debounce(
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

const downloadPng = () => {
  debounceDwonloadPng()
}

watch(isFullscreen, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

watch([() => props.content, () => props.theme], () => {
  render()
})

const toolMap = {
  download: {
    name: t('el.codeMermaid.download', '下载图片'),
    icon: 'icon-download',
    action: downloadPng,
  },
  zoomOut: {
    name: t('el.codeMermaid.zoomOut', '缩小'),
    icon: 'icon-zoom-out',
    action: zoomOut,
  },
  zoomIn: {
    name: t('el.codeMermaid.zoomIn', '放大'),
    icon: 'icon-zoom-in',
    action: zoomIn,
  },
  resetZoom: {
    name: t('el.codeMermaid.resetZoom', '适应页面'),
    icon: 'icon-adapt-page',
    action: resetZoom,
  },
  fullscreen: {
    name: t('el.codeMermaid.fullscreen', '全屏查看'),
    icon: 'icon-full-screen',
    action: toggleFullscreen,
  },
}

defineExpose({
  toggleView,
  zoomIn,
  zoomOut,
  resetZoom,
  toggleFullscreen,
  downloadPng,
  onCopy,
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
