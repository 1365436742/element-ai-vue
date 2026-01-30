<template>
  <Tooltip placement="top" :disabled="!isOverflow">
    <span ref="textRef" :class="[className, ns.b()]">
      <slot></slot>
    </span>
    <template #content>
      <slot></slot>
    </template>
  </Tooltip>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useNamespace } from '@element-ai-vue/hooks'
import Tooltip from '../tooltip/index.vue'

defineProps<{
  className?: string
}>()
const textRef = ref<HTMLSpanElement | null>(null)
const isOverflow = ref(false)
const ns = useNamespace('tooltip-text')

const checkOverflow = async () => {
  await nextTick()
  if (textRef.value) {
    const element = textRef.value
    // 检查文本是否超出容器宽度
    const isTextOverflow = element.scrollWidth > element.clientWidth
    isOverflow.value = isTextOverflow
  }
}

onMounted(() => {
  checkOverflow().catch(() => {})
})
</script>
