<template>
  <NodeViewWrapper :class="ns.b()">
    <Popover v-model:visible="visible" :effect="theme">
      <div :class="ns.e('select-wap')">
        <span style="margin-inline-end: 4px">{{ lable }}</span>
        <span
          class="element-ai-vue-iconfont icon-select-down"
          :class="ns.e('select-icon')"
        ></span>
      </div>
      <template #content>
        <component
          v-if="selectSlotContent"
          :is="selectSlotContent"
          :options="options"
          :theme="theme"
        />
        <div v-else :class="ns.e('options-wap')">
          <div
            v-for="option in options"
            :key="option.value"
            :class="[
              ns.em('options-wap', 'option-item'),
              ns.is('active', option.value === selectValue),
            ]"
            @click="handleChange(option.value)"
          >
            {{ option.label }}
            <span
              v-if="option.value === selectValue"
              class="element-ai-vue-iconfont icon-correct"
              :class="ns.em('options-wap', 'icon')"
            ></span>
          </div>
        </div>
      </template>
    </Popover>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { SELECT_SLOT_CONTENT_INJECTION_KEY } from '@element-ai-vue/constants'
import { useNamespace } from '@element-ai-vue/hooks'
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { computed, inject, ref } from 'vue'
import Popover from '../../popover/index.vue'
import { SenderSelectOption } from '../props'

const props = defineProps<NodeViewProps>()

const visible = ref(false)

// 注入透传的 slot
const selectSlotContent = inject(SELECT_SLOT_CONTENT_INJECTION_KEY, null)
const theme = inject('theme', 'light')

const ns = useNamespace('select-slot')
const options = computed<SenderSelectOption[]>(() => {
  return JSON.parse(props.node.attrs.options || '[]')
})

const selectValue = computed(() => {
  return props.node.attrs.value
})

const lable = computed(() => {
  return (
    options.value.find((o) => o.value === props.node.attrs.value)?.label ||
    options.value[0]?.label ||
    ''
  )
})
const handleChange = (val: string) => {
  visible.value = false
  if (typeof val === 'string') {
    props.updateAttributes({ value: val })
  }
}
</script>
