# Sender 输入框

Sender 输入框组件。

[tiptap](https://tiptap.dev/)

## 基础用法

:::demo SenderBase

```vue
<template>
  <button class="switch-btn" @click="variant = 'updown'">垂直</button>
  <button class="switch-btn" @click="variant = 'default'">水平</button>
  <div class="wapper" :class="{ 'focus-class': focusClass }">
    <ElASender
      v-model="content"
      :placeholder
      :variant
      @focus="focusClass = true"
      @blur="focusClass = false"
    ></ElASender>
  </div>
</template>

<script setup lang="ts">
import { ElASender } from 'element-ai-vue'
import { ref } from 'vue'

const content = ref(``)
const variant = ref<'default' | 'updown'>('default')
const focusClass = ref(false)
const placeholder = ref(`请输入聊天内容`)
</script>

<style scoped lang="scss">
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
```

:::

## 插入html

:::demo SenderBaseHtml

```vue
<template>
  <button class="switch-btn" @click="variant = 'updown'">垂直</button>
  <button class="switch-btn" @click="variant = 'default'">水平</button>
  <div class="wapper" :class="{ 'focus-class': focusClass }">
    <ElASender
      v-model="content"
      v-model:show-input-tag-prefix="showInputTagPrefix"
      inputTagPrefixValue="技能：翻译"
      :placeholder
      :variant
      @focus="focusClass = true"
      @blur="focusClass = false"
    ></ElASender>
  </div>
</template>

<script setup lang="ts">
import { ElASender } from 'element-ai-vue'
import { ref } from 'vue'

const content = ref(`<p>ss</p>`)
const variant = ref<'default' | 'updown'>('default')
const focusClass = ref(false)

const placeholder = ref(`请输入聊天内容`)

const showInputTagPrefix = ref(true)
</script>

<style scoped lang="scss">
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
```

:::

::: tip 扩展提醒
如果你想扩展更多html类型，可以查看源码方式，自行传入extensions进行扩展使用
:::
