<template>
  <div :class="ns.b()" @click="onRemove">
    <div :class="ns.e('wrapper')">
      {{ value }}
    </div>
    <div :class="ns.e('remove')">
      <span
        class="element-ai-vue-iconfont icon-close"
        :class="ns.em('remove', 'icon')"
        @click="onRemove"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '@element-ai-vue/hooks'

const ns = useNamespace('input-tag-updown')

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
})
const emits = defineEmits(['remove'])

const onRemove = () => {
  emits('remove')
}
</script>
