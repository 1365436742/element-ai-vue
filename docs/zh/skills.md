# Agent Skills

::: tip 实验性
实验性项目：帮助 AI Agent 以更少的 token 更准确地使用库。欢迎反馈。
:::

[element-ai-vue/skills](https://github.com/element-ai-vue/skills) AI Agent 技能。安装该技能后，当您使用 AI Agent 协助开发 Vue 或 Nuxt 应用程序时，它可以自动利用 ElementAiVue 提供的丰富功能集。

这使得 Agent 无需互联网连接或额外权限即可准确使用 ElementAiVue 组件。

## 安装

```bash
npx skills add element-ai-vue/skills
```

### Claude Code 市场

为Claude Code用户提供了另一种选择：

```bash
# Add marketplace
/plugin marketplace add element-ai-vue/skills

# Install individual skills
/plugin install element-ai-vue@element-ai-vue-skills
```

## 使用示例

安装 Skill 后，您可以直接询问 Agent 关于 ElementAiVue 组件的用法，例如：

**Input:**

> 请帮我写一个使用 ElementAiVue 的 Bubble 组件的例子。

**Output:**

Agent 将根据 Skill 提供的信息生成准确的代码：

```vue
<script setup lang="ts">
import { Bubble } from 'element-ai-vue'
</script>

<template>
  <Bubble content="Hello, Element AI Vue!" />
</template>
```
