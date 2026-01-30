<template>
  <ElAThoughtChain :list="list"></ElAThoughtChain>
</template>

<script setup lang="ts">
import { ElAThoughtChain, ThoughtChainItem } from 'element-ai-vue'
import { ref } from 'vue'

const list = ref<ThoughtChainItem[]>([
  {
    key: 1,
    title: '第一步：理解需求',
    hiddenLine: true,
    extended: true,
    description:
      '分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。',
  },
  {
    key: 2,
    title: '第二步：设计架构',
    hiddenLine: true,
    description: '制定系统架构，选择技术栈和工具。',
  },
  {
    key: 3,
    title: '第三步：编码实现',
    hiddenLine: true,
    description: '根据设计文档进行编码，完成各项功能。',
  },
  {
    key: 4,
    title: '第四步：测试调试',
    hiddenLine: true,
    description: '进行单元测试和集成测试，修复发现的问题。',
  },
  {
    key: 5,
    title: '第五步：部署上线',
    hiddenLine: true,
    description: '将系统部署到生产环境，确保稳定运行。',
  },
  {
    key: 6,
    title: '第五步：部署上线',
    hiddenLine: true,
  },
])
</script>

<style scoped></style>
