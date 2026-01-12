<template>
  <ElAMarkdown
    :content="content"
    :code-mermaid-props="{ disabledZoom: ['wheel'] }"
  >
    <template #code-highlight-header="{ content, language, isCopied, onCopy }">
      <div class="header">
        <div>{{ language }}</div>
        <button @click="onCopy">{{ isCopied ? '已复制' : '复制' }}</button>
      </div>
    </template>
    <template
      #code-mermaid-toolbar="{
        zoomIn,
        zoomOut,
        resetZoom,
        toggleFullscreen,
        downloadPng,
        isCodeView,
        toggleView,
        onCopy,
        isCopied,
      }"
    >
      <div class="tool">
        <template v-if="isCodeView">
          <button @click="onCopy">{{ isCopied ? '已复制' : '复制' }}</button>
          <button @click="toggleView">预览</button>
        </template>
        <template v-else>
          <button @click="zoomIn">放大</button>
          <button @click="zoomOut">缩小</button>
          <button @click="resetZoom">重置</button>
          <button @click="downloadPng">下载PNG</button>
          <button @click="toggleFullscreen">全屏切换</button>
          <button @click="toggleView">查看代码</button>
        </template>
      </div>
    </template>
    <template
      #code-mermaid-fullscreen-toolbar="{
        zoomIn,
        zoomOut,
        resetZoom,
        toggleFullscreen,
        downloadPng,
      }"
    >
      <div class="tool-fullscreen">
        <button @click="zoomIn">放大</button>
        <button @click="zoomOut">缩小</button>
        <button @click="resetZoom">重置</button>
        <button @click="downloadPng">下载PNG</button>
        <button @click="toggleFullscreen">退出全屏</button>
      </div>
    </template>
  </ElAMarkdown>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ElAMarkdown } from 'element-ai-vue'

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
# mermaid 流程图示例
\`\`\`mermaid
flowchart TD
    A[用户访问注册页面] --> B{输入注册信息}
    B -->|信息完整| C[后端验证信息合法性]
    B -->|信息缺失| D[提示用户补充必填项]
    D --> B
    C -->|验证通过| E[发送验证邮件/短信]
    C -->|验证失败| F[提示错误原因（如手机号已注册）]
    F --> B
    E --> G{用户完成验证}
    G -->|24小时内验证| H[创建用户账号，注册成功]
    G -->|超时未验证| I[验证链接失效，重新发送]
    I --> E
    E --> G{用户完成验证}
    G -->|24小时内验证| H[创建用户账号，注册成功]
    G -->|超时未验证| I[验证链接失效，重新发送]
    I --> E
    E --> G{用户完成验证}
    G -->|24小时内验证| H[创建用户账号，注册成功]
    G -->|超时未验证| I[验证链接失效，重新发送]
    I --> E
    E --> G{用户完成验证}
    G -->|24小时内验证| H[创建用户账号，注册成功]
    G -->|超时未验证| I[验证链接失效，重新发送]
    I --> E
\`\`\`
`)
</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #000;
  padding: 8px;
  color: #fff;
}
.tool {
  background-color: #000;
  display: flex;
  gap: 8px;
  color: #fff;
}
.tool-fullscreen {
  background-color: #000;
  display: flex;
  gap: 8px;
  color: #fff;
}
</style>
