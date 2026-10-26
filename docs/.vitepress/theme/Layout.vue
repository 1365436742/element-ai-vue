<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed } from 'vue'
import { ElAConfigProvider } from 'element-ai-vue'
import en from '@element-ai-vue/locale/lang/en'
import zhCn from '@element-ai-vue/locale/lang/zh-cn'

const { Layout } = DefaultTheme
const { lang, isDark } = useData()

const configProviderLocale = computed(() => {
  const localeMap = {
    'en-US': en,
    'zh-CN': zhCn,
  }
  return localeMap[lang.value] || zhCn
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
