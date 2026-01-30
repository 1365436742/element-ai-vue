<template>
  <div ref="box"></div>
</template>
<script setup lang="ts">
import {
  h,
  onMounted,
  onBeforeUnmount,
  render,
  useSlots,
  useTemplateRef,
  computed,
  watch,
} from 'vue'
import { ElAConfigProvider } from 'element-ai-vue'
// @ts-ignore
import themeChalk from '@element-ai-vue/theme-chalk/src/index.scss?inline'
// @ts-ignore
import shadowBoxChalk from './shadow-box.scss?inline'
import { useData } from 'vitepress'
import en from '@element-ai-vue/locale/lang/en'
import zhCn from '@element-ai-vue/locale/lang/zh-cn'

const shadowHost = useTemplateRef('box')
const slots = useSlots()
const { lang, isDark } = useData()

const configProviderLocale = computed(() => {
  const localeMap: Record<string, typeof en> = {
    'en-US': en,
    'zh-CN': zhCn,
  }
  return localeMap[lang.value] || zhCn
})
let container: Element | null = null

const renderDom = () => {
  if (!shadowHost.value) return

  let shadowRoot = shadowHost.value.shadowRoot
  if (!shadowRoot) {
    shadowRoot = shadowHost.value.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = themeChalk + shadowBoxChalk
    shadowRoot.appendChild(style)
  }

  container = shadowRoot.querySelector('.shadow-container')
  if (!container) {
    container = document.createElement('div')
    container.className = 'shadow-container'
    shadowRoot.appendChild(container)
  }

  const vnode = h(
    ElAConfigProvider,
    {
      theme: isDark.value ? 'dark' : 'light',
      locale: configProviderLocale.value,
    },
    {
      default: () => slots.default?.(),
    }
  )
  render(vnode, container)
}

onMounted(() => {
  renderDom()
})

watch(isDark, () => {
  renderDom()
})

onBeforeUnmount(() => {
  if (container) {
    render(null, container)
    container = null
  }
})
</script>
