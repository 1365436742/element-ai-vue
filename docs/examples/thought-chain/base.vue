<template>
  <ElAThoughtChain :list="list"></ElAThoughtChain>
</template>

<script setup lang="ts">
import { ElAThoughtChain, ThoughtChainItem } from 'element-ai-vue'
import { useData } from 'vitepress'
import { ref, watch } from 'vue'

const { isDark } = useData()

const setList = () => {
  list.value = [
    {
      key: 1,
      title: '第一步：理解需求',
      description:
        '分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。分析用户需求，明确目标和功能。',
      icon: `/assets/book-icon${isDark.value ? '-dark' : ''}.png`,
    },
    {
      key: 2,
      title: '第二步：设计架构',
      description: '制定系统架构，选择技术栈和工具。',
      icon: `/assets/book-icon${isDark.value ? '-dark' : ''}.png`,
    },
    {
      key: 3,
      title: '第三步：编码实现',
      description: '根据设计文档进行编码，完成各项功能。',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
    },
    {
      key: 4,
      title: '第四步：测试调试',
      description: '进行单元测试和集成测试，修复发现的问题。',
      icon: `/assets/book-icon${isDark.value ? '-dark' : ''}.png`,
    },
    {
      key: 5,
      title: '第五步：部署上线',
      description: '将系统部署到生产环境，确保稳定运行。',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
    },
    {
      key: 6,
      title: '第五步：部署上线',
      icon: `/assets/search-icon${isDark.value ? '-dark' : ''}.png`,
    },
  ]
}
const list = ref<ThoughtChainItem[]>([])

watch(
  isDark,
  () => {
    setList()
  },
  {
    immediate: true,
  }
)
</script>

<style scoped></style>
