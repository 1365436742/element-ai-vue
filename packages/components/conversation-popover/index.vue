<template>
  <div :class="ns.b()"></div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { conversationPopoverProps } from './props'
import { computed } from 'vue'

defineOptions({
  name: 'ElAConversationPopover',
})

const props = defineProps({
  ...conversationPopoverProps,
})

const ns = useNamespace('conversation-popover')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
</script>
