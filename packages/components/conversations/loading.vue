<template>
  <!-- 加载动画组件 -->
  <div ref="loadMoreTrigger" :class="ns.b()">
    <span :class="ns.e('dot')"></span>
    <span :class="ns.e('dot')"></span>
    <span :class="ns.e('dot')"></span>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '@element-ai-vue/hooks'
import { useIntersectionObserver } from '@vueuse/core'
import { onUnmounted, useTemplateRef } from 'vue'

const ns = useNamespace('conversations-loading-dots')

const loadMoreTrigger = useTemplateRef('loadMoreTrigger')

const props = defineProps({
  hasMore: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['next'])

const { stop } = useIntersectionObserver(
  loadMoreTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      if (props.loading || props.hasMore) return
      emits('next')
    }
  },
  {
    threshold: 0,
    rootMargin: '0px 0px 30px 0px',
  }
)

onUnmounted(() => {
  stop()
})
</script>
