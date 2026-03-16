<template>
  <div :class="ns.b()"></div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { conversationMenuProps } from './props'
import { computed } from 'vue'

defineOptions({
  name: 'ElAConversationMenu',
})

const props = defineProps({
  ...conversationMenuProps,
})

const ns = useNamespace('conversation-menu')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
</script>
