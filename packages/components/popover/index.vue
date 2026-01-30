<template>
  <div :class="ns.b()" ref="referenceRef">
    <slot></slot>
  </div>
  <Teleport :to="teleportTo">
    <Transition
      :name="`${defaultNamespace}-popover-fade`"
      @before-enter="onBeforeEnter"
      @before-leave="onBeforeLeave"
      @after-enter="onAfterEnter"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="isOpen"
        ref="floatingRef"
        :class="[ns.e('popper'), ns.is('dark', isDark)]"
        :style="[floatingStyles, popoverWidthStyle]"
        role="dialog"
        @mouseenter="onPopperMouseEnter"
        @mouseleave="onPopperMouseLeave"
      >
        <div :class="ns.e('inner')">
          <div :class="ns.e('content')">
            <slot name="content">{{ content }}</slot>
          </div>
        </div>
        <div
          v-if="showArrow"
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
import { defaultNamespace, useNamespace } from '@element-ai-vue/hooks'
import { popoverProps, popoverEmits } from './props'

defineOptions({
  name: 'ElAPopover',
})

const props = defineProps(popoverProps)
const emit = defineEmits(popoverEmits)

const ns = useNamespace('popover')

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

const popoverWidthStyle = computed(() => {
  if (props.width === 'auto') return {}
  const width =
    typeof props.width === 'number' ? `${props.width}px` : props.width
  return { width }
})

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

// Arrow styles
const arrowSide = computed(() => {
  return actualPlacement.value.split('-')[0]
})

const arrowStyles = computed(() => {
  const { x, y } = middlewareData.value.arrow || {}
  const staticSide = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }[arrowSide.value] as string

  return {
    left: x !== null && x !== undefined ? `${x}px` : '',
    top: y !== null && y !== undefined ? `${y}px` : '',
    [staticSide]: '-5px',
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

const show = () => {
  if (props.disabled) return
  clearTimers()
  showTimer = setTimeout(() => {
    isOpen.value = true
    emit('update:visible', true)
    emit('show')
  }, props.showAfter)
}

const hide = () => {
  clearTimers()
  hideTimer = setTimeout(() => {
    isOpen.value = false
    emit('update:visible', false)
    emit('hide')
  }, props.hideAfter)
}

const toggle = () => {
  if (isOpen.value) {
    hide()
  } else {
    show()
  }
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

const onClick = (e: MouseEvent) => {
  if (props.trigger === 'click') {
    e.stopPropagation()
    toggle()
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

const onPopperMouseEnter = () => {
  if (props.trigger === 'hover') {
    clearTimers()
  }
}

const onPopperMouseLeave = () => {
  if (props.trigger === 'hover') {
    hide()
  }
}

// Transition hooks
const onBeforeEnter = () => {
  emit('before-enter')
}

const onBeforeLeave = () => {
  emit('before-leave')
}

const onAfterEnter = () => {
  emit('after-enter')
}

const onAfterLeave = () => {
  emit('after-leave')
}

// Click outside handler
const onClickOutside = (e: MouseEvent) => {
  if (!props.closeOnClickOutside) return
  if (!isOpen.value) return

  const target = e.target as Node
  const reference = referenceRef.value
  const floating = floatingRef.value

  if (reference?.contains(target) || floating?.contains(target)) {
    return
  }

  hide()
}

// Escape key handler
const onKeydown = (e: KeyboardEvent) => {
  if (!props.closeOnPressEscape) return
  if (!isOpen.value) return

  if (e.key === 'Escape') {
    hide()
  }
}

// Watch for manual control
watch(
  () => props.visible,
  (val) => {
    if (val !== undefined) {
      clearTimers()
      if (val) {
        isOpen.value = true
        emit('show')
      } else {
        isOpen.value = false
        emit('hide')
      }
    }
  }
)

// Event binding
const bindEvents = () => {
  const reference = referenceRef.value
  if (!reference) return

  reference.addEventListener('mouseenter', onMouseEnter)
  reference.addEventListener('mouseleave', onMouseLeave)
  reference.addEventListener('click', onClick)
  reference.addEventListener('focus', onFocus, true)
  reference.addEventListener('blur', onBlur, true)

  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
}

const unbindEvents = () => {
  const reference = referenceRef.value
  if (!reference) return

  reference.removeEventListener('mouseenter', onMouseEnter)
  reference.removeEventListener('mouseleave', onMouseLeave)
  reference.removeEventListener('click', onClick)
  reference.removeEventListener('focus', onFocus, true)
  reference.removeEventListener('blur', onBlur, true)

  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
}

onMounted(() => {
  bindEvents()
})

onBeforeUnmount(() => {
  clearTimers()
  unbindEvents()
})

// Expose methods
defineExpose({
  show,
  hide,
  toggle,
})
</script>
