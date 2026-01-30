<template>
  <div>
    <div ref="maxWidthRef"></div>
    <div ref="thinkingRef" :class="ns.b()">
      <div
        ref="minWidthRef"
        :class="[ns.e('top'), ns.is('expanded', !expanded)]"
      >
        <div :class="ns.em('top', 'title')" ref="titleRef">
          <slot name="title">{{ title }}</slot>
        </div>

        <slot name="action">
          <div :class="ns.em('top', 'action')" @click="expanded = !expanded">
            <span
              class="element-ai-vue-iconfont"
              :class="expanded ? 'icon-out-screen' : 'icon-full-screen'"
            ></span>
          </div>
        </slot>
      </div>
      <TransitionHeight :show="expanded ?? false">
        <div :class="ns.e('content')" :style="{ width: maxWidth || 'auto' }">
          <slot></slot>
        </div>
      </TransitionHeight>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '@element-ai-vue/hooks'
import { useElementSize, useMutationObserver } from '@vueuse/core'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { ThinkingEmitsType, thinkingProps } from './props'
import TransitionHeight from '../transition-height/index.vue'

defineOptions({
  name: 'ElAThinking',
})
const props = defineProps({
  ...thinkingProps,
})
const emit = defineEmits<ThinkingEmitsType>()

// 内部状态，当没有传 v-model 时使用
const internalValue = ref(props.modelValue)

// 判断是否使用外部传入的 modelValue
const isControlled = computed(() => props.modelValue !== undefined)

// 实际使用的展开状态值
const expanded = computed({
  get: () => (isControlled.value ? props.modelValue : internalValue.value),
  set: (val) => {
    if (isControlled.value) {
      emit('update:modelValue', val ?? false)
    } else {
      internalValue.value = val
    }
  },
})
const ns = useNamespace('thinking')
const thinkingRef = useTemplateRef('thinkingRef')
const maxWidthRef = useTemplateRef('maxWidthRef')
const minWidthRef = useTemplateRef('minWidthRef')
const titleRef = useTemplateRef('titleRef')
const { width: maxWidthVal } = useElementSize(maxWidthRef)

const maxWidth = computed(() => {
  const el = thinkingRef.value
  if (el?.clientWidth !== maxWidthVal.value && el) {
    if (!expanded.value) {
      el.style.width = getMinWidth()
    } else {
      el.style.width = maxWidthVal.value + 'px'
    }
  }
  return maxWidthVal.value + 'px'
})

const getMinWidth = () => {
  const el = minWidthRef.value
  if (!el) return '0px'
  el.style.width = 'min-content'
  const width = Math.min(el.offsetWidth + 2, maxWidthVal.value) + 'px'
  el.style.width = 'auto'
  return width
}

const handleTitleChange = () => {
  if (!expanded.value) {
    const el = thinkingRef.value
    if (el) {
      el.style.width = getMinWidth()
    }
  }
}

useMutationObserver(
  titleRef,
  () => {
    handleTitleChange()
  },
  {
    childList: true,
    subtree: true,
    characterData: true,
  }
)

watch(
  () => expanded.value,
  (newVal) => {
    const el = thinkingRef.value
    if (!el) return
    const startWidth = el.offsetWidth + 'px'
    const minWidth = getMinWidth()
    const targetWidth = newVal ? maxWidth.value : minWidth
    el.style.width = startWidth
    el.style.transition = 'width 0.2s ease-in-out'
    requestAnimationFrame(() => {
      el.style.width = targetWidth
    })
  }
)

onMounted(() => {
  const el = thinkingRef.value
  if (!el) return
  if (!expanded.value) {
    el.style.width = getMinWidth()
  }
})
</script>
