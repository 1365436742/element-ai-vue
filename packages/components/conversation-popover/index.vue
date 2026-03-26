<template>
  <Teleport to="body" :disabled="!isMobileWidth">
    <div :class="[ns.b(), ns.is('mobile', isMobileWidth && !closeMobile)]">
      <div :class="ns.e('wrapper')">
        <Transition
          :name="ns.e('collapse')"
          @before-leave="leaveing = true"
          @after-leave="leaveing = false"
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
import { computed, ref } from 'vue'

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

const closeMobile = computed(() => {
  if (props.collapse) {
    return !leaveing.value
  }
  return props.collapse
})

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
</script>
