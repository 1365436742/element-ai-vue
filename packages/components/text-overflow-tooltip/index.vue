<template>
  <ElATooltip
    :class-name="ns.e('toolip')"
    :content="content"
    :disabled="!isOverflow"
    :effect="theme"
  >
    <span ref="textRef" :class="ns.b()">
      {{ content }}
    </span>
  </ElATooltip>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import ElATooltip from '../tooltip'
import { textOverflowTooltipProps } from './props'

defineOptions({
  name: 'ElATextOverflowTooltip',
})

const props = defineProps({
  ...textOverflowTooltipProps,
})

const ns = useNamespace('text-overflow-tooltip')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)

const textRef = useTemplateRef('textRef')
const isOverflow = ref(false)
useResizeObserver(textRef, () => {
  checkOverflow()
})
const checkOverflow = () => {
  if (textRef.value) {
    const element = textRef.value
    // 检查 slot 内容是否超出父级元素宽度
    const isTextOverflow = element.scrollWidth > element.clientWidth
    isOverflow.value = isTextOverflow
  }
}
</script>
