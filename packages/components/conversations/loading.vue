<template>
  <div ref="loadMoreTrigger">
    <slot>
      <div :class="ns.b()">
        <span :class="ns.e('dot')"></span>
        <span :class="ns.e('dot')"></span>
        <span :class="ns.e('dot')"></span>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '@element-ai-vue/hooks'
import { useIntersectionObserver } from '@vueuse/core'
import { onUnmounted, useTemplateRef } from 'vue'

const ns = useNamespace('conversations-loading-dots')

const loadMoreTrigger = useTemplateRef('loadMoreTrigger')

const props = defineProps({
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
      if (props.loading) return
      emits('next')
    }
  },
  {
    threshold: 0,
  }
)

onUnmounted(() => {
  stop()
})
</script>
