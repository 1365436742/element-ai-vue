<template>
  <div :class="[ns.b(), ns.b(variant)]">
    <slot v-if="variant === 'default'" name="prefix"></slot>
    <div :class="ns.e('content')">
      <BaseInput
        v-bind="props"
        ref="baseInputRef"
        @update:modelValue="(val) => emits('update:modelValue', val)"
        @update:showInputTagPrefix="
          (val) => emits('update:showInputTagPrefix', val)
        "
        @enterPressed="onEnterPressed"
        @paste="(event) => emits('paste', event)"
        @pasteFile="(files) => emits('pasteFile', files)"
        @blur="emits('blur')"
        @focus="emits('focus')"
      >
        <template #input-tag-prefix>
          <slot name="input-tag-prefix"></slot>
        </template>
      </BaseInput>
    </div>
    <div :class="ns.e('action')">
      <slot v-if="variant === 'updown'" name="prefix"></slot>
      <div :class="ns.em('action', 'other')">
        <slot name="action-list"></slot>
      </div>
      <slot name="send-btn" :disabled="isEmpty">
        <div
          :class="[
            ns.e('send-btn'),
            {
              disabled: isEmpty,
            },
          ]"
          @click="onSend"
        >
          <span
            class="element-ai-vue-iconfont icon-zhibiaoka-shangsheng"
          ></span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElASender',
})
import { computed, useSlots, useTemplateRef, provide } from 'vue'
import { useNamespace } from '@element-ai-vue/hooks'
import { SELECT_SLOT_CONTENT_INJECTION_KEY } from '@element-ai-vue/constants'
import BaseInput from './base-input/index.vue'
import { BaseInputEmitsType } from './base-input/props'
import { senderProps, SenderEmitsType } from './props'

const ns = useNamespace('sender')
const props = defineProps({
  ...senderProps,
})

const slots = useSlots()

provide(SELECT_SLOT_CONTENT_INJECTION_KEY, slots['select-slot-content'])

const emits = defineEmits<BaseInputEmitsType & SenderEmitsType>()
const baseInputRef = useTemplateRef('baseInputRef')

const isEmpty = computed(() => {
  return baseInputRef.value?.editor?.isEmpty
})
const onEnterPressed = () => {
  emits('enterPressed')
  onSend()
}
const onSend = () => {
  if (isEmpty.value) return
  emits('send', baseInputRef.value?.editor?.getText() || '')
}
defineExpose({
  ...baseInputRef.value,
})
</script>
