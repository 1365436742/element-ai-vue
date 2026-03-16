<template>
  <div :class="ns.b()"></div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { conversationCreateProps } from './props'
import { computed } from 'vue'

defineOptions({
  name: 'ElAConversationCreate',
})

const props = defineProps({
  ...conversationCreateProps,
})

const ns = useNamespace('conversation-create')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
</script>
