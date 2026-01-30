<template>
  <div :class="[ns.b(), ns.b(placement), ns.b(footerTrigger + '-footer')]">
    <div v-if="hasAvatar" :class="ns.e('avatar')">
      <slot name="avatar"></slot>
    </div>
    <div :class="ns.e('content-wrapper')">
      <div v-if="loading" :class="ns.e('loading')">
        <span :class="ns.em('loading', 'dot')"></span>
        <span :class="ns.em('loading', 'dot')"></span>
        <span :class="ns.em('loading', 'dot')"></span>
      </div>
      <template v-else>
        <div v-if="hasHeader" :class="ns.e('header')">
          <slot name="header"></slot>
        </div>
        <div :class="ns.e('content')">
          <div
            :class="[
              ns.em('content', 'text'),
              ns.em('content', variant),
              ns.em('content', shape),
            ]"
          >
            <slot :content="contentData">
              <ElAMarkdown
                v-if="isMarkdown"
                :content="contentData"
                :theme
                v-bind="markdownProps"
              />
              <template v-else> {{ contentData }}</template>
            </slot>
          </div>
        </div>
        <div v-if="hasFooter" :class="ns.e('footer')">
          <slot name="footer"></slot>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme, useTyperwriter } from '@element-ai-vue/hooks'
import ElAMarkdown from '../markdown/index.vue'
import { bubbleProps } from './props'
import { computed, watch, useSlots } from 'vue'

const slots = useSlots()
const hasHeader = computed(() => !!slots.header)
const hasAvatar = computed(() => !!slots.avatar)
const hasFooter = computed(() => !!slots.footer)

defineOptions({
  name: 'ElABubble',
})
const props = defineProps({
  ...bubbleProps,
})
const ns = useNamespace('bubble')
const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)

const {
  content: typerwriterContent,
  setText,
  start,
  setConfig,
  done: overTyperwriter,
} = useTyperwriter()
const contentData = computed(() => {
  if (props.typing) {
    return typerwriterContent.value
  }
  return props.content
})

watch(
  () => props.content,
  (newVal) => {
    if (props.typing) {
      setText(newVal)
    }
  },
  {
    immediate: true,
  }
)

watch(
  () => props.typingOver,
  (newVal, oldVal) => {
    setConfig({
      staticText: newVal,
    })
    if (oldVal === false && newVal === true) {
      overTyperwriter()
    }
  },
  {
    immediate: true,
  }
)

watch(
  () => props.loading,
  () => {
    if (props.loading === false && props.typing) {
      start()
    }
  },
  {
    immediate: true,
  }
)

defineExpose({
  overTyperwriter,
})
</script>
