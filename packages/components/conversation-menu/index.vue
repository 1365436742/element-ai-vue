<template>
  <div :class="[ns.b(), ns.m(theme)]">
    <template v-for="item in items" :key="item[keyName]">
      <div
        :class="[
          ns.e('item'),
          ns.is('disabled', item.disabled),
          ns.is('active', item[keyName] === activeKey),
        ]"
        :style="
          ns.cssVarBlock({
            depth: String(depth),
          })
        "
        @click="handlClick(item)"
      >
        <div :class="ns.em('item', 'text')">
          <slot :item="item">
            <ElATextOverflowTooltip
              :content="item.label"
            ></ElATextOverflowTooltip>
          </slot>
        </div>
        <div
          v-if="item.children && item.children.length"
          :class="[
            ns.em('item', 'arrow'),
            ns.is('open', openKeys.includes(item[keyName])),
          ]"
        >
          <svg
            viewBox="64 64 896 896"
            focusable="false"
            data-icon="right"
            width="1em"
            height="1em"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"
            ></path>
          </svg>
        </div>
      </div>
      <TransitionHeight
        v-if="item.children && item.children.length"
        :show="openKeys.includes(item[keyName])"
      >
        <ElAConversationMenu
          v-bind="{ ...props, items: item.children }"
          @update:active-key="emits('update:activeKey', $event)"
          @update:open-keys="emits('update:openKeys', $event)"
          :class="ns.b('chidren')"
        >
          <template v-for="name in slotNames" :key="name" #[name]="slotProps">
            <slot
              :name="name"
              v-bind="(slotProps as Record<string, any>) ?? {}"
            ></slot>
          </template>
        </ElAConversationMenu>
      </TransitionHeight>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { computed, inject, provide } from 'vue'
import {
  ConversationMenu,
  ConversationMenuEmitsType,
  conversationMenuProps,
} from './props'
import TransitionHeight from '../transition-height/index.vue'
import ElATextOverflowTooltip from '../text-overflow-tooltip'

defineOptions({
  name: 'ElAConversationMenu',
})

const props = defineProps({
  ...conversationMenuProps,
})

const slots = defineSlots()
const slotNames = computed(() => Object.keys(slots) as string[])

const emits = defineEmits<ConversationMenuEmitsType>()

const ns = useNamespace('conversation-menu')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)

// 从父级注入当前深度，根节点默认为 0
const depth = inject<number>('conversation-menu-depth', 0)
// 向子级提供深度 +1
provide('conversation-menu-depth', depth + 1)

const handlClick = (item: ConversationMenu) => {
  if (item.disabled) return
  const activeKey = item[props.keyName]
  if (item.children && item.children.length) {
    const newOpenKeys = props.openKeys.includes(activeKey)
      ? props.openKeys.filter((k) => k !== activeKey)
      : [...props.openKeys, activeKey]
    emits('update:openKeys', newOpenKeys)
    return
  }
  emits('update:activeKey', activeKey)
}
</script>
