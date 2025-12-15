# CodeMermaid 流程图

CodeMermaid 是一个基于 [Mermaid](https://mermaid.js.org/) 的流程图渲染组件，支持动态渲染 Mermaid 图表。

## 基础用法

使用 `content` 属性传入 Mermaid 语法字符串。

:::demo CodeMermaidBase

```vue
<template>
  <ElACodeMermaid :content="content"></ElACodeMermaid>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElACodeMermaid } from 'element-ai-vue'

const content = ref(`graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
`)
</script>
```

:::

## 插槽-自定义工具栏

支持插槽定义，自定义工具栏后，工具栏主题需要自己做主题色适配
工具栏有两种

1. 鼠标悬浮工具栏
2. 全屏之后的工具栏

:::demo CodeMermaidSlotExampls

```vue
<template>
  <ElACodeMermaid :content="content">
    <template
      #toolbar="{
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
      #fullscreen-toolbar="{
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
  </ElACodeMermaid>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElACodeMermaid } from 'element-ai-vue'

const content = ref(`flowchart TD
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
`)
</script>

<style scoped lang="scss">
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
```

:::

## props

| 属性名            | 类型            | 必填 | 默认值 | 描述                                                                                           |
| :---------------- | :-------------- | :--- | :----- | :--------------------------------------------------------------------------------------------- |
| content           | `string`        | 是   | —      | Mermaid 语法内容                                                                               |
| disabledWheelZoom | `boolean`       | 否   | false  | 禁用鼠标滚轮缩放                                                                               |
| theme             | `string`        | 否   | `base` | Mermaid 主题，支持 `default`, `forest`, `dark`, `neutral`, `base`                              |
| fullscreenMode    | `string`        | 否   | `page` | 全屏模式，支持 `web` (网页全屏) 和 `page` (页面全屏)                                           |
| mermaidConfig     | `MermaidConfig` | 否   | `{}`   | Mermaid 配置对象，详见 [Mermaid Config](https://mermaid.js.org/config/schema-docs/config.html) |

## slot

| 插槽名             | 说明       | 插槽参数                                                                                                                                                                                                                                                                                                                   |
| :----------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fullscreen-toolbar | 全屏工具栏 | `isCodeView`: 当前显示代码(true)、mermaid图表(false)<br>`isCopied`: 表示已经复制，避免它连续复制会有1s的间隔时间让他复制下一次<br>`onCopy`: 复制代码函数<br>`toggleView`: 切换为code、mermaid图表<br>`zoomIn`: 放大<br>`zoomOut`: 缩小<br>`resetZoom`: 恢复默认<br>`toggleFullscreen`: 切换全屏<br>`downloadPng`: 下载图片 |
| toolbar            | 普通工具栏 | 参数同上                                                                                                                                                                                                                                                                                                                   |
