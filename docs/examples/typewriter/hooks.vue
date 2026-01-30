<template>
  <div class="status">{{ status }}</div>
  <div class="btns">
    <button class="switch-btn" @click="start">开始</button>
    <button class="switch-btn" @click="paused">暂停</button>
    <button class="switch-btn" @click="stop">停止</button>
  </div>
  <div class="btns">
    <button class="switch-btn" @click="addRandomText">添加随机文字</button>
  </div>
  <div class="text-value">{{ content }}</div>
</template>

<script setup lang="ts">
import { useTyperwriter } from 'element-ai-vue'

const { status, content, start, paused, stop, setText, addText } =
  useTyperwriter({
    interval: 100,
  })

setText('Hello, Element AI Vue!')

const addRandomText = () => {
  const texts = [
    'This is a typewriter effect.',
    'You can pause and stop it.',
    'Element AI Vue makes it easy!',
    'Enjoy coding with Vue.js!',
  ]
  const randomText = texts[Math.floor(Math.random() * texts.length)]
  addText(randomText)
}
</script>

<style scoped>
.status {
  font-size: 20px;
  margin-bottom: 20px;
}
</style>
