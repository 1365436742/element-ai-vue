<template>
  <div :class="ns.b()">
    <div
      v-for="(item, index) in list"
      :class="ns.e('item')"
      :key="item.key || index"
    >
      <div
        :class="[ns.e('status'), ns.is('last-item', index === list.length - 1)]"
      >
        <slot name="icon" :item="item">
          <img
            v-if="item.icon"
            :class="ns.em('status', 'icon')"
            :src="item.icon"
            alt=""
          />
        </slot>
      </div>
      <div :class="ns.e('content')">
        <slot name="title" :item="item">
          <div :class="ns.em('content', 'title')">{{ item.title }}</div>
        </slot>
        <slot name="description" :item="item">
          <div
            :class="ns.em('content', 'description')"
            v-if="item.description !== undefined"
          >
            {{ item.description }}
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '@element-ai-vue/hooks'
import { thoughtChainProps } from './props'

defineOptions({
  name: 'ElAThoughtChain',
})
defineProps({
  ...thoughtChainProps,
})
const ns = useNamespace('thought-chain')
</script>
