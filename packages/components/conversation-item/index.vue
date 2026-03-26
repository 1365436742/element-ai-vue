<template>
  <section :class="[ns.b(), ns.m(theme), ns.is('sticky', sticky)]">
    <ul
      :class="ns.e('group')"
      v-for="(items, groupName) in groups"
      :key="groupName"
    >
      <li
        v-if="groupName !== 'undefined' && groupName !== 'null' && groupName"
        :class="ns.e('title')"
      >
        <slot name="group" :groupName="groupName">
          {{ groupName }}
        </slot>
      </li>
      <li
        v-for="item in items"
        :class="[
          ns.e('item'),
          ns.is('active', item[keyName] === props.activeKey),
          ns.is('disabled', item.disabled),
        ]"
        :key="item[keyName]"
        @click="handleClick(item)"
      >
        <slot name="item" :item="item">
          <ElATextOverflowTooltip
            :content="item.label"
          ></ElATextOverflowTooltip>
        </slot>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { computed } from 'vue'
import { groupBy } from 'lodash-es'
import {
  ConversationItem,
  conversationItemProps,
  CoversationItemEmitsType,
} from './props'
import ElATextOverflowTooltip from '../text-overflow-tooltip'

defineOptions({
  name: 'ElAConversationItem',
})

const emits = defineEmits<CoversationItemEmitsType>()
const props = defineProps({
  ...conversationItemProps,
})

const groups = computed(() => groupBy(props.items, (item) => item.group))
const ns = useNamespace('conversation-item')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)

const handleClick = (item: ConversationItem) => {
  if (item.disabled) return
  const activeKey = item[props.keyName]
  emits('update:activeKey', activeKey)
  emits('activeChange', activeKey, item)
}
</script>
