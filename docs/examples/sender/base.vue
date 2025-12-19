<template>
  <button class="switch-btn" @click="variant = 'updown'">垂直</button>
  <button class="switch-btn" @click="variant = 'default'">水平</button>

  <div class="wapper" :class="{ 'focus-class': focusClass }">
    <ShadowBox>
      <ElASender
        v-model="content"
        :placeholder
        :variant
        @focus="focusClass = true"
        @blur="focusClass = false"
      ></ElASender>
    </ShadowBox>
  </div>
</template>

<script setup lang="ts">
import { ElASender } from 'element-ai-vue'
import { ref } from 'vue'
import ShadowBox from '../shadow-box.vue'

const content = ref(``)
const variant = ref<'default' | 'updown'>('default')
const focusClass = ref(false)

const placeholder = ref(`请输入聊天内容`)
</script>

<style scoped lang="scss">
html.dark {
  .wapper {
    border-color: rgba(121, 121, 121, 0.6);

    &.focus-class {
      border-color: rgba($color: #fff, $alpha: 0.6);
    }
  }
}

.wapper {
  width: 600px;
  border-radius: 8px;
  padding: 8px 7px;
  border: 1px solid rgba(17, 25, 37, 0.15);

  &.focus-class {
    border-color: rgba(17, 25, 37, 0.45);
  }
}
</style>
