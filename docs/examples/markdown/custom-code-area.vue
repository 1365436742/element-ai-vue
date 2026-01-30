<template>
  <ElAMarkdown :content="content">
    <template #code="props">
      <div v-if="props.language === 'echarts'">
        <echartsTest
          :content="props.content"
          :theme="props.theme"
        ></echartsTest>
      </div>
      <ElACodeHighlight v-else v-bind="props"></ElACodeHighlight>
    </template>
  </ElAMarkdown>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ElAMarkdown, ElACodeHighlight } from 'element-ai-vue'
import echartsTest from './echarts-test.vue'

const content = ref(`
# js代码块
\`\`\`javascript
/**
 * 生成指定区间 [min, max] 的随机整数（包含 min 和 max）
 * @param {number} min - 最小值（整数）
 * @param {number} max - 最大值（整数）
 * @returns {number} 随机整数
 */
function getRandomInt(min, max) {
  // 先取整避免非整数参数问题，再计算区间
  min = Math.ceil(min);
  max = Math.floor(max);
  // Math.random() 生成 [0,1)，计算后得到 [min, max]
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 示例：生成 1 到 10 之间的随机整数（包含1和10）
console.log(getRandomInt(1, 10)); // 输出：1~10 之间的随机数
\`\`\`

# echarts 自定义
\`\`\`echarts
option = {
  title: {
    text: 'Stacked Line'
  },
  tooltip: {
    trigger: 'axis'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  toolbox: {
    feature: {
      saveAsImage: {}
    }
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: 'Email',
      type: 'line',
      stack: 'Total',
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: 'Union Ads',
      type: 'line',
      stack: 'Total',
      data: [220, 182, 191, 234, 290, 330, 310]
    },
    {
      name: 'Video Ads',
      type: 'line',
      stack: 'Total',
      data: [150, 232, 201, 154, 190, 330, 410]
    },
    {
      name: 'Direct',
      type: 'line',
      stack: 'Total',
      data: [320, 332, 301, 334, 390, 330, 320]
    },
    {
      name: 'Search Engine',
      type: 'line',
      stack: 'Total',
      data: [820, 932, 901, 934, 1290, 1330, 1320]
    }
  ]
};
\`\`\`
`)
</script>
