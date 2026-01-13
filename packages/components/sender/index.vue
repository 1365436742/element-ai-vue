<template>
  <div :class="[ns.b(), ns.b(variant), theme === 'dark' ? ns.m('dark') : '']">
    <slot v-if="variant === 'default'" name="prefix"></slot>
    <div :class="ns.e('content')">
      <BaseInput
        v-bind="props"
        ref="baseInputRef"
        @update:modelValue="
          (val) => !loading && emits('update:modelValue', val)
        "
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
      <slot v-if="loading" name="send-btn-loading">
        <div :class="ns.e('loading')" @click="emits('update:loading', false)">
          <span class="element-ai-vue-iconfont icon-stop-chat"></span>
        </div>
      </slot>
      <slot v-else name="send-btn" :disabled="isEmpty">
        <div
          :class="[
            ns.e('send-btn'),
            {
              disabled: isEmpty,
            },
          ]"
          @click="onSend"
        >
          <span class="element-ai-vue-iconfont icon-arrow-up"></span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElASender',
})
import { computed, useTemplateRef, provide } from 'vue'
import { useNamespace } from '@element-ai-vue/hooks'
import { SELECT_SLOT_CONTENT_INJECTION_KEY } from '@element-ai-vue/constants'
import BaseInput from './base-input/index.vue'
import { BaseInputEmitsType } from './base-input/props'
import { senderProps, SenderEmitsType, SenderSlotsType } from './props'

const ns = useNamespace('sender')
const props = defineProps({
  ...senderProps,
})

const slots = defineSlots<SenderSlotsType>()

provide(SELECT_SLOT_CONTENT_INJECTION_KEY, slots['select-slot-content'])
provide('theme', props.theme)

const emits = defineEmits<BaseInputEmitsType & SenderEmitsType>()
const baseInputRef = useTemplateRef('baseInputRef')

const isEmpty = computed(() => {
  return baseInputRef.value?.editor?.isEmpty
})
const onEnterPressed = () => {
  if (props.loading) return
  emits('enterPressed')
  onSend()
}
const onSend = () => {
  if (isEmpty.value || props.loading) return
  emits('send', baseInputRef.value?.editor?.getText() || '')
}
defineExpose({
  editor: () => baseInputRef.value?.editor,
  focus: () => baseInputRef.value?.editor?.commands?.focus(),
  blur: () => baseInputRef.value?.editor?.commands?.blur(),
})
</script>
