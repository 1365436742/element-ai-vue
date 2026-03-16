<template>
  <div :class="ns.b()"></div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { conversationItemProps } from './props'
import { computed } from 'vue'

defineOptions({
  name: 'ElAConversationItem',
})

const props = defineProps({
  ...conversationItemProps,
})

const ns = useNamespace('conversation-item')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
</script>
