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
        <TransitionHeight
          v-if="!item.hiddenLine"
          :show="item.extended ?? true"
          :class="ns.e('status-line-warp')"
        >
          <div :class="ns.e('status-line')"></div>
        </TransitionHeight>
      </div>
      <div :class="ns.e('content')">
        <slot name="title" :item="item">
          <div :class="ns.e('content-top')">
            <div :class="ns.em('content-top', 'title')">{{ item.title }}</div>
            <div
              v-if="item.extended !== undefined"
              :class="ns.em('content-top', 'extend-warp')"
              @click="item.extended = !item.extended"
            >
              <div
                :class="[
                  ns.em('content-top', 'extended'),
                  ns.is('extended', item.extended),
                ]"
              ></div>
            </div>
          </div>
        </slot>
        <TransitionHeight :show="item.extended ?? true">
          <slot name="description" :item="item">
            <div
              :class="ns.em('content', 'description')"
              v-if="item.description !== undefined"
            >
              {{ item.description }}
            </div>
          </slot>
        </TransitionHeight>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '@element-ai-vue/hooks'
import { thoughtChainProps } from './props'
import TransitionHeight from '../transition-height/index.vue'

defineOptions({
  name: 'ElAThoughtChain',
})
defineProps({
  ...thoughtChainProps,
})
const ns = useNamespace('thought-chain')
</script>
