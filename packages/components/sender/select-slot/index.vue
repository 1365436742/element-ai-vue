<template>
  <NodeViewWrapper :class="ns.b()">
    <div :class="ns.e('select-wap')">
      <span style="margin-inline-end: 4px">{{ lable }}</span>
      <span
        class="element-ai-vue-iconfont icon-xiala1"
        :class="ns.e('select-icon')"
      ></span>
    </div>
    <component
      :is="selectSlotContent"
      v-if="selectSlotContent"
      :options="options"
    />
    <!-- <dropdown>
      <div class="select-wap">
        <span style="margin-inline-end: 4px">{{ lable }}</span>
        <i class="mtdicon mtdicon-down-thick" />
      </div>
      <template #dropdown>
        <dropdown-menu>
          <dropdown-menu-item
            v-for="option in options"
            :key="option.value"
            @click="handleChange(option.value)"
          >
            {{ option.label }}
          </dropdown-menu-item>
        </dropdown-menu>
      </template>
    </dropdown> -->
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { SELECT_SLOT_CONTENT_INJECTION_KEY } from '@element-ai-vue/constants'
import { useNamespace } from '@element-ai-vue/hooks'
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { computed, inject } from 'vue'

const props = defineProps<NodeViewProps>()

// 注入透传的 slot
const selectSlotContent = inject(SELECT_SLOT_CONTENT_INJECTION_KEY, null)

const ns = useNamespace('select-slot')
const options = computed<{ value: string; label: string }[]>(() => {
  return JSON.parse(props.node.attrs.options || '[]')
})

const lable = computed(() => {
  return (
    options.value.find((o) => o.value === props.node.attrs.value)?.label ||
    options.value[0]?.label ||
    ''
  )
})

const handleChange = (val: string) => {
  if (typeof val === 'string') {
    props.updateAttributes({ value: val })
  }
}
</script>
