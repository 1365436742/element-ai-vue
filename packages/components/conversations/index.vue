<template>
  <div :class="[ns.b(), ns.m(theme)]">
    <div :class="ns.e('header')">
      <slot name="header"></slot>
    </div>
    <div :class="ns.e('scroll')">
      <slot name="scroll"></slot>
      <Loading
        v-if="hasMore"
        :class="ns.e('loading')"
        :loading
        @next="loadMore"
      >
        <slot name="loading"> </slot>
      </Loading>
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
import { computed, ref } from 'vue'

defineOptions({
  name: 'ElAConversations',
})

const props = defineProps({
  ...conversationsProps,
})

const ns = useNamespace('conversations')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)

const loading = ref(false)

const loadMore = async () => {
  loading.value = true
  try {
    await props?.onNext?.()
  } finally {
    loading.value = false
  }
}
</script>
