<template>
  <NodeViewWrapper as="span" :class="ns.b()" :style="{ minWidth }">
    <span
      v-if="isEmpty"
      ref="placeholderRef"
      :data-placeholder="true"
      :contentEditable="false"
      :class="ns.e('placeholder')"
    >
      {{ placeholder }}
    </span>
    <NodeViewContent as="div" :class-name="ns.e('content')" />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { strings } from '@element-ai-vue/constants'
import { useNamespace } from '@element-ai-vue/hooks'
import {
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from '@tiptap/vue-3'
import { computed, nextTick, ref, watchEffect } from 'vue'

const ns = useNamespace('input-slot')
const props = defineProps<NodeViewProps>()
const placeholder = props.node.attrs.placeholder || ''

const isEmpty = computed(() => {
  return props.node.textContent === strings.ZERO_WIDTH_CHAR
})

const minWidth = computed(() => {
  return isEmpty.value && placeholderWidth.value
    ? `${placeholderWidth.value}px`
    : undefined
})

const placeholderRef = ref<HTMLElement | null>(null)
const placeholderWidth = ref<number | undefined>(undefined)

watchEffect(async () => {
  if (isEmpty.value && placeholderRef.value) {
    await nextTick(() => {
      placeholderWidth.value = placeholderRef.value?.offsetWidth
    })
  }
})
</script>
