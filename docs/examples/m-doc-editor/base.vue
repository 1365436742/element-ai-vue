<template>
  <div class="m-doc-box" :class="{ 'focus-class': focusClass }">
    <ShadowBox>
      <ElAMDocEditor
        v-model="content"
        @focus="focusClass = true"
        @blur="focusClass = false"
      ></ElAMDocEditor>
    </ShadowBox>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElAMDocEditor } from 'element-ai-vue'
import ShadowBox from '../shadow-box.vue'

const focusClass = ref(false)
const content = ref(`# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

二次方程 \\( ax^2 + bx + c = 0 \\) 的解为 \\( x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a} \\)。

## 块级公式

### 基础数学运算

$$
\\begin{aligned}
a + b &= c \\\\
d - e &= f \\\\
g \\times h &= i \\\\
\\frac{j}{k} &= l
\\end{aligned}
$$

### 平方根和指数

$$
\\sqrt{x} = x^{\\frac{1}{2}}
$$

$$
\\sqrt[n]{x} = x^{\\frac{1}{n}}
$$

$$
e^{i\\theta} = cos + sin
$$


**这是粗体文本**    *这是斜体文本*  
__这也是粗体文本__   _这也是斜体文本_

***这是粗斜体文本***  ~~这是带删除线的文本~~

- 无序列表项1
- 无序列表项2
  - 子列表项2.1
  - 子列表项2.2

[element-ai-vue](/ "element-ai-vue")
# mermaid图表
\`\`\`mermaid
flowchart TD
    A[用户访问注册页面] --> B{输入注册信息}
    B -->|信息完整| C[后端验证信息合法性]
    B -->|信息缺失| D[提示用户补充必填项]
\`\`\`
![示例图片](/logo.svg "一张示例图")

>这是一段引用文本
>
>> 这是嵌套的引用文本
---
| 姓名 | 年龄 | 职业 |
| ---- | ---- | ---- |
| 张三 | 25   | 工程师 |
| 李四 | 30   | 设计师 |

# js代码块
\`\`\`javascript
console.log(123); 
\`\`\`
`)
</script>

<style scoped lang="scss">
html.dark {
  .m-doc-box {
    border-color: rgba(121, 121, 121, 0.6);

    &.focus-class {
      border-color: rgba($color: #fff, $alpha: 0.6);
    }
  }
}

.m-doc-box {
  width: 100%;
  border-radius: 8px;
  padding: 0 8px;
  border: 1px solid rgba(17, 25, 37, 0.15);

  &.focus-class {
    border-color: rgba(17, 25, 37, 0.45);
  }
}
</style>
