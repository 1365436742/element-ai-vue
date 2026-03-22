<template>
  <div :class="[ns.b(), ns.m(theme)]">
    <div :class="ns.e('header')">
      <slot name="header"></slot>
    </div>
    <div :class="ns.e('scroll')">
      <slot name="scroll"></slot>
      <div :class="ns.e('loading')" v-if="hasMore">
        <slot name="loading"> <Loading></Loading> </slot>
      </div>
    </div>
    <div :class="ns.e('footer')">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { conversationsProps } from './props'
import Loading from './loading.vue'
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
