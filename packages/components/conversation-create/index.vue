<template>
  <div :class="[ns.b(), ns.m(theme)]" @click="handleClick">
    <slot name="icon">
      <div :class="ns.e('icon')">
        <svg
          viewBox="64 64 896 896"
          focusable="false"
          data-icon="plus"
          width="1em"
          height="1em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"
          ></path>
          <path
            d="M192 474h672q8 0 8 8v60q0 8-8 8H160q-8 0-8-8v-60q0-8 8-8z"
          ></path>
        </svg>
      </div>
    </slot>
    <div :class="ns.e('title')">
      <slot>
        {{ t('el.conversationCreate.title', '新对话') }}
      </slot>
    </div>
    <slot name="end">
      <div :class="ns.e('end')">
        <span>⌘</span>
        <span>K</span>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useLocale, useNamespace, useTheme } from '@element-ai-vue/hooks'
import { useHotkeys } from '@element-ai-vue/utils'
import { ConversationCreateEmitsType, conversationCreateProps } from './props'
import { computed } from 'vue'

defineOptions({
  name: 'ElAConversationCreate',
})

const props = defineProps({
  ...conversationCreateProps,
})

const emits = defineEmits<ConversationCreateEmitsType>()

const { t } = useLocale()
const ns = useNamespace('conversation-create')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)

const handleClick = () => {
  emits('conversationCreateClick')
}

useHotkeys([
  {
    keys: props.shortcutKeys,
    callback: () => {
      handleClick()
    },
  },
])
</script>
