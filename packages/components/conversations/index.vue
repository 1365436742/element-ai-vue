<template>
  <div :class="ns.b()"></div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { conversationsProps } from './props'
import { computed } from 'vue'

defineOptions({
  name: 'ElAConversations',
})

const props = defineProps({
  ...conversationsProps,
})

const ns = useNamespace('conversations')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
</script>
