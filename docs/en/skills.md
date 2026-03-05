# Agent Skills

::: tip Experimental
Experimental Project: Aims to help AI agents use libraries more accurately with fewer tokens. Feedback is welcome.
:::

[element-ai-vue/skills](https://github.com/element-ai-vue/skills) AI Agent Skills. When you use an AI Agent to assist with developing Vue or Nuxt applications after installing this skill, it can automatically leverage the rich feature set provided by ElementAiVue.

This allows the agent to accurately use ElementAiVue components without requiring an internet connection or additional permissions.

## Installation

```bash
npx skills add element-ai-vue/skills
```

### Claude Code Marketplace

Another option for Claude Code users:

```bash
# Add marketplace
/plugin marketplace add element-ai-vue/skills

# Install individual skills
/plugin install element-ai-vue@element-ai-vue-skills
```

## Example Usage

After installing the Skill, you can ask the Agent about the usage of ElementAiVue components directly, for example:

**Input:**

> Please write an example using the Bubble component from ElementAiVue.

**Output:**

The Agent will generate accurate code based on the information provided by the Skill:

```vue
<script setup lang="ts">
import { Bubble } from 'element-ai-vue'
</script>

<template>
  <Bubble content="Hello, Element AI Vue!" />
</template>
```
