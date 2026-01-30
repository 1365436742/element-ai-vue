<template>
  <div class="status">{{ status }}</div>
  <div class="btns">
    <button class="switch-btn" @click="onStart">开始</button>
    <button class="switch-btn" @click="onPaused">暂停</button>
    <button class="switch-btn" @click="onStop">停止</button>
  </div>
  <div class="btns">
    <button class="switch-btn" @click="addRandomText">添加随机文字</button>
  </div>
  <div class="text-value">{{ textValue }}</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { createTypewriter } from 'element-ai-vue'

const textValue = ref('')
const status = ref('')
const typewriter = createTypewriter({
  interval: 100,
})

typewriter.setText('Hello, Element AI Vue!')
const getStatus = () => {
  status.value = typewriter.getInfo().status
  return status.value
}
getStatus()
const onStart = () => {
  typewriter.start((text: string) => {
    textValue.value = text
  })
  getStatus()
}

const onPaused = () => {
  typewriter.paused()
  getStatus()
}

const onStop = () => {
  typewriter.stop()
  getStatus()
}

const addRandomText = () => {
  const texts = [
    'This is a typewriter effect.',
    'You can pause and stop it.',
    'Element AI Vue makes it easy!',
    'Enjoy coding with Vue.js!',
  ]
  const randomText = texts[Math.floor(Math.random() * texts.length)]
  typewriter.addText(randomText)
}
onBeforeUnmount(() => {
  typewriter.destory()
})
</script>

<style scoped>
.status {
  font-size: 20px;
  margin-bottom: 20px;
}
</style>
