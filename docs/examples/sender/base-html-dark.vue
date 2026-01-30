<template>
  <div>
    <button class="switch-btn" @click="variant = 'updown'">垂直</button>
    <button class="switch-btn" @click="variant = 'default'">水平</button>
  </div>

  <div>
    <button class="switch-btn" @click="showInputTagPrefix = true">
      前置标签开启
    </button>
    <button class="switch-btn" @click="showInputTagPrefix = false">
      前置标签关闭
    </button>
    <button class="switch-btn" @click="changeContent('input-slot')">
      input-slot
    </button>
    <button class="switch-btn" @click="changeContent('select-slot')">
      select-slot
    </button>
  </div>
  <div class="box">
    <div class="wapper" :class="{ 'focus-class': focusClass }">
      <ShadowBox>
        <ElASender
          v-model="content"
          v-model:show-input-tag-prefix="showInputTagPrefix"
          theme="dark"
          inputTagPrefixValue="技能：翻译"
          :placeholder
          :variant
          @focus="focusClass = true"
          @blur="focusClass = false"
        >
        </ElASender>
      </ShadowBox>
    </div>
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
const showInputTagPrefix = ref(false)

const options = ref([
  { label: '前端开发', value: '1' },
  { label: '设计视觉', value: '2' },
  { label: 'java开发', value: '3' },
])
const temp: Record<string, string> = {
  'input-slot':
    '我是一个<input-slot placeholder="[职业你好我试试]"></input-slot>',
  'select-slot': `我是<select-slot value="3" options='${JSON.stringify(
    options.value
  )}'></select-slot>，帮我完成...`,
}
const changeContent = (key: string) => {
  content.value = temp[key]
}
</script>

<style scoped lang="scss">
.box {
  background-color: #000;
  padding: 20px;
  .wapper {
    width: 100%;
    border-radius: 8px;
    padding: 8px;
    border: 1px solid rgba(121, 121, 121, 0.6);

    &.focus-class {
      border-color: rgba($color: #fff, $alpha: 0.6);
    }
  }
}
</style>
