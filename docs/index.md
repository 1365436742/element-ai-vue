---
title: Vue 3 AI 聊天组件库
sidebar: false
---

# Element AI Vue — Vue 3 AI 聊天组件库

Element AI Vue（element-ai-vue）是开源的 Vue 3 AI 交互组件库，提供消息气泡、输入框、流式 Markdown、思考状态与文件上传组件，帮助开发者构建智能助手和大模型对话界面。

[进入中文文档](/zh/) · [English documentation](/en/)

[快速开始](/zh/start) · [消息气泡](/zh/base/bubble) · [输入框](/zh/base/sender) · [Markdown 渲染](/zh/base/markdown)

<script setup>
import { onBeforeMount } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()
onBeforeMount(() => {
  router.go('/zh/')
})
</script>
