<script setup lang="ts">
import { onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue'
import { ElAMarkdown } from '@element-ai-vue/components'

const content = ref(`
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

**这是粗体文本**  
__这也是粗体文本__

*这是斜体文本*  
_这也是斜体文本_

***这是粗斜体文本***

~~这是带删除线的文本~~

- 无序列表项1
- 无序列表项2
  - 子列表项2.1
  - 子列表项2.2

1. 有序列表项1
2. 有序列表项2
  1. 子列表项2.1
  2. 子列表项2.2

[Element-Plus-X](https://element-plus-x.com "Element-Plus-X")

![示例图片](https://element-plus-x.com/logo.png "一张示例图")

>这是一段引用文本
>
>> 这是嵌套的引用文本

---

| 姓名 | 年龄 | 职业 |
| ---- | ---- | ---- |
| 张三 | 25   | 工程师 |
| 李四 | 30   | 设计师 |

### 行内代码

用 \`ElmentPlusX\` 表示 行内块代码用 \`\` 语句

### 代码块

\`\`\`javascript
const code = "Element-Plus-X";
\`\`\`

### 行内公式
$e^{i\\pi} + 1 = 0$

### 块级公式
$$
F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-i\\omega t} dt
$$

### mermaid 饼状图

\`\`\`mermaid
pie
    "传媒及文化相关" : 35
    "广告与市场营销" : 8
    "游戏开发" : 15
    "影视动画与特效" : 12
    "互联网产品设计" : 10
    "VR/AR开发" : 5
    "其他" : 15
\`\`\`
`)
// const showContent = ref('')
// const timer = ref<number | null>(null)
// onMounted(() => {
//   const lines = content.value.split('\n')
//   const maxIndex = lines.length
//   let index = 0
//   timer.value = window.setInterval(() => {
//     showContent.value += lines[index]
//     /** index随机加0-10 */
//     index++
//     if (index >= maxIndex) {
//       clearInterval(timer.value!)
//     }
//   }, 50)
// })
// onBeforeUnmount(() => {
//   if (timer.value) {
//     clearInterval(timer.value)
//   }
// })
</script>

<template>
  <div class="demo-component">
    <ElAMarkdown :content="content"></ElAMarkdown>
  </div>
</template>

<style scoped>
.demo-component {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}

button {
  padding: 8px 16px;
  background-color: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: var(--vp-c-brand-dark);
}
</style>
