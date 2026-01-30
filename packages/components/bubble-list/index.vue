<template>
  <div :class="ns.b()" ref="scrollContentRef">
    <div :class="ns.b('content')" ref="resizeContentRef">
      <slot> </slot>
    </div>

    <div :class="ns.b('bottom-action')" v-if="!hiddenBackButton">
      <slot
        name="bottom-action"
        :scrollToBottom="scrollToBottom"
        :scrollToTop="scrollToTop"
        :scrollToIndex="scrollToIndex"
      >
        <div
          :class="ns.be('bottom-action', 'inner')"
          @click="() => scrollToBottom()"
        >
          <div :class="ns.be('bottom-action', 'icon')"></div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatScroll, useNamespace } from '@element-ai-vue/hooks'
import { useTemplateRef } from 'vue'
import { bubbleListProps } from './props'

defineOptions({
  name: 'ElABubbleList',
})

const props = defineProps({
  ...bubbleListProps,
})

const scrollContentRef = useTemplateRef('scrollContentRef')
const resizeContentRef = useTemplateRef('resizeContentRef')

const { scrollToBottom, scrollToTop, scrollToIndex, hiddenBackButton } =
  useChatScroll(scrollContentRef, resizeContentRef, props)

const ns = useNamespace('bubble-list')

defineExpose({
  scrollToBottom,
  scrollToTop,
  scrollToIndex,
})
</script>
