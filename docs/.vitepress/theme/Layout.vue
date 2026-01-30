<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData, useRouter } from 'vitepress'
import { onMounted, watch, computed } from 'vue'
import { ElAConfigProvider } from 'element-ai-vue'
import en from '@element-ai-vue/locale/lang/en'
import zhCn from '@element-ai-vue/locale/lang/zh-cn'

const { Layout } = DefaultTheme
const { page, lang, isDark } = useData()
const router = useRouter()

const configProviderLocale = computed(() => {
  const localeMap = {
    'en-US': en,
    'zh-CN': zhCn,
  }
  return localeMap[lang.value] || zhCn
})

onMounted(() => {
  watch(
    () => page.value.isNotFound,
    (isNotFound) => {
      if (isNotFound) {
        // 避免在 /zh/ 路径下无限循环跳转
        if (router.route.path !== '/zh/') {
          router.go('/zh/')
        }
      }
    },
    { immediate: true }
  )
})
</script>

<template>
  <ElAConfigProvider
    :locale="configProviderLocale"
    :theme="isDark ? 'dark' : 'light'"
  >
    <Layout />
  </ElAConfigProvider>
</template>

<style lang="scss">
.switch-btn {
  margin-bottom: 20px;
  padding: 4px 16px;
  background-color: #0057ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.3s;
  white-space: nowrap;
  & + .switch-btn {
    margin-left: 8px;
  }
  &.no-margin {
    margin: 0;
  }
}

.switch-btn:hover {
  opacity: 0.8;
}
</style>
