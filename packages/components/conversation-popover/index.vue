<template>
  <Teleport to="body" :disabled="!isMobileWidth">
    <div
      :class="[
        ns.b(),
        ns.is('mobile', isMobileWidth && !closeMobile),
        ns.m(theme),
      ]"
    >
      <div ref="wrapperRef" :class="ns.e('wrapper')">
        <Transition
          :name="ns.e('collapse')"
          @before-leave="onBeforeLeave"
          @leave="onLeave"
          @after-leave="onAfterLeave"
          @before-enter="onBeforeEnter"
          @enter="onEnter"
          @after-enter="onAfterEnter"
        >
          <div v-if="!props.collapse" :class="ns.e('content')">
            <slot></slot>
          </div>
        </Transition>
      </div>
      <Transition :name="ns.e('mark')">
        <div
          v-if="isMobileWidth && !collapse"
          :class="ns.e('mark')"
          @click="emits('update:collapse', true)"
        ></div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useDevice, useNamespace, useTheme } from '@element-ai-vue/hooks'
import { conversationPopoverProps, ConversatioPopoverEmitsType } from './props'
import { computed, ref, watch } from 'vue'

const wrapperRef = ref<HTMLElement | null>(null)

defineOptions({
  name: 'ElAConversationPopover',
})

const props = defineProps({
  ...conversationPopoverProps,
})
const emits = defineEmits<ConversatioPopoverEmitsType>()

const ns = useNamespace('conversation-popover')
const { isMobileWidth } = useDevice()

const leaveing = ref(false)

// PC 端 wrapper 宽度动画钩子
const savedWidth = ref('')

function onBeforeLeave(el: Element | HTMLElement) {
  leaveing.value = true
  if (!isMobileWidth.value && wrapperRef.value) {
    savedWidth.value = wrapperRef.value.scrollWidth + 'px'
    wrapperRef.value.style.width = savedWidth.value
    ;(el as HTMLElement).style.width = savedWidth.value
  }
}
function onLeave() {
  if (!isMobileWidth.value && wrapperRef.value) {
    wrapperRef.value.style.width = '0'
  }
}
function onAfterLeave() {
  leaveing.value = false
}
function onBeforeEnter(el: Element) {
  if (!isMobileWidth.value && wrapperRef.value) {
    ;(el as HTMLElement).style.width = savedWidth.value
    wrapperRef.value.style.width = '0'
  }
}
function onEnter() {
  if (!isMobileWidth.value && wrapperRef.value) {
    wrapperRef.value.style.width = savedWidth.value
  }
}
function onAfterEnter(el: Element) {
  if (!isMobileWidth.value && wrapperRef.value) {
    wrapperRef.value.style.width = ''
    ;(el as HTMLElement).style.width = ''
  }
}

watch(
  () => [isMobileWidth.value, props.collapse] as const,
  ([isMobile, collapse]) => {
    if (isMobile && !collapse) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
  { immediate: true }
)

const closeMobile = computed(() => {
  if (props.collapse) {
    return !leaveing.value
  }
  return props.collapse
})

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
</script>
