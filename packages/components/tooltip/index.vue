<template>
  <div :class="ns.b()" ref="referenceRef">
    <slot></slot>
  </div>
  <Teleport :to="teleportTo">
    <Transition :name="`${defaultNamespace}-tooltip-fade`">
      <div
        v-if="isOpen"
        ref="floatingRef"
        :class="[ns.e('popper'), ns.is('dark', isDark)]"
        :style="floatingStyles"
        role="tooltip"
        @mouseenter="onPopperMouseEnter"
        @mouseleave="onPopperMouseLeave"
      >
        <div :class="ns.e('content')">
          <slot name="content">{{ content }}</slot>
        </div>
        <div
          ref="arrowRef"
          :class="ns.e('arrow')"
          :style="arrowStyles"
          :data-side="arrowSide"
        ></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  useFloating,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
} from '@floating-ui/vue'
import {
  defaultNamespace,
  useDevice,
  useNamespace,
} from '@element-ai-vue/hooks'
import {
  registerActiveTooltip,
  unregisterActiveTooltip,
} from '@element-ai-vue/utils'
import { tooltipProps, tooltipEmits } from './props'

defineOptions({
  name: 'ElATooltip',
})

const { isTouchDevice } = useDevice()

const props = defineProps(tooltipProps)
const emit = defineEmits(tooltipEmits)

const ns = useNamespace('tooltip')

// Teleport target
const teleportTo = computed(() => props.teleportTo || document.body)

// Refs
const referenceRef = ref<HTMLElement | null>(null)
const floatingRef = ref<HTMLElement | null>(null)
const arrowRef = ref<HTMLElement | null>(null)

// State
const isOpen = ref(false)
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

// Computed
const isDark = computed(() => props.effect === 'dark')

// Floating UI setup
const {
  floatingStyles,
  middlewareData,
  placement: actualPlacement,
} = useFloating(referenceRef, floatingRef, {
  placement: computed(() => props.placement),
  whileElementsMounted: autoUpdate,
  middleware: computed(() => [
    offset(props.offset),
    flip({
      fallbackAxisSideDirection: 'start',
    }),
    shift({ padding: 5 }),
    arrow({ element: arrowRef }),
  ]),
})

const arrowSide = computed(() => {
  return actualPlacement.value.split('-')[0]
})

// Arrow styles
const arrowStyles = computed(() => {
  const { x, y } = middlewareData.value.arrow || {}
  const staticSide = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }[actualPlacement.value.split('-')[0]] as string

  return {
    left: x !== null && x !== undefined ? `${x}px` : '',
    top: y !== null && y !== undefined ? `${y}px` : '',
    [staticSide]: '-4px',
  }
})

// Methods
const clearTimers = () => {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

// Tooltip instance for manager
const tooltipInstance = {
  hide: () => {
    clearTimers()
    isOpen.value = false
    emit('update:visible', false)
    emit('hide')
  },
}

const show = () => {
  if (props.disabled || isTouchDevice.value) return
  clearTimers()
  showTimer = setTimeout(() => {
    // 注册到管理器，关闭其他 tooltip
    registerActiveTooltip(tooltipInstance)
    isOpen.value = true
    emit('update:visible', true)
    emit('show')
  }, props.showAfter)
}

const hide = () => {
  clearTimers()
  hideTimer = setTimeout(() => {
    unregisterActiveTooltip(tooltipInstance)
    isOpen.value = false
    emit('update:visible', false)
    emit('hide')
  }, props.hideAfter)
}

const onMouseEnter = () => {
  if (props.trigger === 'hover') {
    show()
  }
}

const onMouseLeave = () => {
  if (props.trigger === 'hover') {
    hide()
  }
}

// Popper 弹出层的鼠标事件 - 保持 tooltip 显示
const onPopperMouseEnter = () => {
  if (props.trigger === 'hover') {
    clearTimers() // 取消隐藏计时器
  }
}

const onPopperMouseLeave = () => {
  if (props.trigger === 'hover') {
    hide()
  }
}

const onClick = () => {
  if (props.trigger === 'click') {
    if (isOpen.value) {
      hide()
    } else {
      show()
    }
  }
}

const onFocus = () => {
  if (props.trigger === 'focus') {
    show()
  }
}

const onBlur = () => {
  if (props.trigger === 'focus') {
    hide()
  }
}

// Watch for manual control
watch(
  () => props.visible,
  (val) => {
    if (val !== undefined) {
      isOpen.value = val
    }
  },
  { immediate: true }
)

// Event listeners
onMounted(() => {
  const el = referenceRef.value
  if (!el) return

  el.addEventListener('mouseenter', onMouseEnter)
  el.addEventListener('mouseleave', onMouseLeave)
  el.addEventListener('click', onClick)
  el.addEventListener('focus', onFocus, true)
  el.addEventListener('blur', onBlur, true)
})

onBeforeUnmount(() => {
  clearTimers()
  unregisterActiveTooltip(tooltipInstance)
  const el = referenceRef.value
  if (!el) return

  el.removeEventListener('mouseenter', onMouseEnter)
  el.removeEventListener('mouseleave', onMouseLeave)
  el.removeEventListener('click', onClick)
  el.removeEventListener('focus', onFocus, true)
  el.removeEventListener('blur', onBlur, true)
})

// Expose methods
defineExpose({
  show,
  hide,
})
</script>
