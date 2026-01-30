<template>
  <button class="switch-btn" @click="variant = 'updown'">垂直</button>
  <button class="switch-btn" @click="variant = 'default'">水平</button>
  <button class="switch-btn" @click="loading = true">加载中</button>
  <button class="switch-btn" @click="inputRef?.focus()">自动聚焦</button>
  <button class="switch-btn" @click="getTextContent()">获取输入框text</button>
  <button class="switch-btn" @click="getJSONContent()">获取输入框json</button>

  <div class="input-content" v-if="inputContent">{{ inputContent }}</div>

  <div class="wapper" :class="{ 'focus-class': focusClass }">
    <ShadowBox>
      <ElASender
        ref="inputRef"
        v-model="content"
        v-model:loading="loading"
        :placeholder
        :variant
        @focus="focusClass = true"
        @blur="focusClass = false"
      >
      </ElASender>
    </ShadowBox>
  </div>
</template>

<script setup lang="ts">
import { ElASender } from 'element-ai-vue'
import { ref, useTemplateRef } from 'vue'
import ShadowBox from '../shadow-box.vue'

const content = ref(``)
const variant = ref<'default' | 'updown'>('default')
const focusClass = ref(false)
const placeholder = ref(`请输入聊天内容`)
const inputRef = useTemplateRef('inputRef')
const loading = ref(false)

const inputContent = ref('')

const getTextContent = () => {
  inputContent.value = inputRef.value?.editor()?.getText() || ''
}
const getJSONContent = () => {
  inputContent.value = JSON.stringify(inputRef.value?.editor()?.getJSON()) || ''
}
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
.input-content {
  margin: 10px 0;
  border: 1px solid #eee;
  padding: 8px;
  border-radius: 4px;
}

.wapper {
  width: 100%;
  border-radius: 8px;
  padding: 8px;
  border: 1px solid rgba(17, 25, 37, 0.15);

  &.focus-class {
    border-color: rgba(17, 25, 37, 0.45);
  }
}
</style>
