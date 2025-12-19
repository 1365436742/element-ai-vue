<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData, useRouter } from 'vitepress'
import { onMounted, watch } from 'vue'

const { Layout } = DefaultTheme
const { page } = useData()
const router = useRouter()

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
  <Layout />
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
  & + .switch-btn {
    margin-left: 8px;
  }
}

.switch-btn:hover {
  opacity: 0.8;
}
</style>
