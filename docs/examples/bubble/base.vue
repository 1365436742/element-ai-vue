<template>
  <div class="base-box">
    <!-- 借助 vueuse定义模版 -->
    <DefineTemplate v-slot="{ content, placement }">
      <ElABubble :content="content" :placement="placement">
        <template #header v-if="!placement">
          <ElAThinking title="今日话题 AI时代">
            <div class="think">
              你好，我是Element AI
              Vue，一个基于Vue3和TypeScript构建的AI组件库，致力于为开发者提供便捷、高效的AI解决方案。
            </div>
          </ElAThinking>
        </template>
        <template #avatar>
          <div class="avatar"></div>
        </template>
        <template #footer>
          <div class="actions" :class="placement">
            <span class="element-ai-vue-iconfont icon-copy"></span>
            <span class="element-ai-vue-iconfont icon-regen"></span>
          </div>
        </template>
      </ElABubble>
    </DefineTemplate>

    <ReuseTemplate content="你好我是element-ai-vue" />
    <ReuseTemplate content="你好我是element-ai-vue" placement="end" />
  </div>
</template>

<script setup lang="ts">
import { ElABubble, ElAThinking } from 'element-ai-vue'
import { createReusableTemplate } from '@vueuse/core'

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()
</script>

<style scoped lang="scss">
html.dark {
  .think {
    color: rgba(255, 255, 255, 0.65);
  }
}
.think {
  padding: 0 12px 10px;
  color: rgba(17, 25, 37, 0.45);
  font-size: 14px;
}
.actions {
  display: flex;
  gap: 8px;
  font-size: 16px;
  &.end {
    justify-content: flex-end;
  }
  & > span {
    cursor: pointer;
    padding: 0 5px;
  }
}
.base-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.avatar {
  width: 32px;
  height: 32px;
  background-color: #828282;
  border-radius: 50%;
}
</style>
