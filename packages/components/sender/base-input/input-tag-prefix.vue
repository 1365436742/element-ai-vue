<template>
  <div :class="ns.b()" @click="onRemove">
    <div :class="ns.e('wrapper')">
      <div :class="ns.em('wrapper', 'content')">
        {{ value }}
        <span
          class="element-ai-vue-iconfont icon-icon-mianxing_copy_close"
          :class="ns.em('content', 'remove')"
          @click="onRemove"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '@element-ai-vue/hooks'

const ns = useNamespace('input-tag-prefix')

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
