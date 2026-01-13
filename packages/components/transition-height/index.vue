<template>
  <Transition
    @before-enter="beforeEnter"
    @enter="enter"
    @after-enter="afterEnter"
    @before-leave="beforeLeave"
    @leave="leave"
    @after-leave="afterLeave"
  >
    <div v-show="show" :class="className">
      <slot></slot>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElATransitionHeight',
})
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  className: {
    type: String,
    default: '',
  },
})
const beforeEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.style.overflow = 'hidden'
  element.style.transition = 'height 0.2s linear'
}

const enter = (el: Element) => {
  const element = el as HTMLElement
  if (element.scrollHeight !== 0) {
    element.style.height = `${element.scrollHeight}px`
  } else {
    element.style.height = ''
  }
}

const afterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = ''
  element.style.overflow = ''
  element.style.transition = ''
}

const beforeLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = `${element.scrollHeight}px`
  element.style.overflow = 'hidden'
  element.style.transition = 'height 0.2s linear'
}

const leave = (el: Element) => {
  const element = el as HTMLElement
  if (element.scrollHeight !== 0) {
    element.style.height = '0'
  }
}

const afterLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = ''
  element.style.overflow = ''
  element.style.transition = ''
}
</script>
