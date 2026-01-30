<template>
  <div
    ref="echartsDom"
    style="width: 100%; height: 400px; margin: 16px 0"
  ></div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import JSON5 from 'json5'
import * as echarts from 'echarts'

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  theme: {
    type: String,
    default: 'light',
  },
})
let myChart: echarts.ECharts | null = null
const echartsDom = useTemplateRef('echartsDom')

const options = computed(() => {
  const regex = /option\s*=\s*({[\s\S]*});?$/
  const match = props.content.trim().match(regex)
  if (match) {
    try {
      return JSON5.parse(match[1])
    } catch (e) {
      return null
    }
  }
})

const renderChart = () => {
  if (!echartsDom.value) return
  if (!myChart) {
    myChart = echarts.init(echartsDom.value, props.theme)
  }
  if (options.value) {
    myChart.setTheme(props.theme === 'dark' ? 'dark' : 'default')
    myChart.setOption(options.value)
  }
}

const handleResize = () => {
  myChart?.resize()
}

watch([options, () => props.theme], () => {
  renderChart()
})
onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped></style>
