<template>
  <div :class="ns.b()"></div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { overflowToolbarProps } from './props'
import { computed } from 'vue'

defineOptions({
  name: 'ElAOverflowToolbar',
})

const props = defineProps({
  ...overflowToolbarProps,
})

const ns = useNamespace('overflow-toolbar')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
</script>
