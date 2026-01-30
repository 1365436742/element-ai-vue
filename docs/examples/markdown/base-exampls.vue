<template>
  <ShadowBox>
    <ElAMarkdown :content="content"></ElAMarkdown>
  </ShadowBox>
</template>
<script setup lang="ts">
import ShadowBox from '../shadow-box.vue'
import { ref } from 'vue'
import { ElAMarkdown } from 'element-ai-vue'

const content = ref(`
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

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
