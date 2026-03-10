<template>
  <div
    :class="[
      ns.b(),
      nsMd.b(),
      nsMd.e('markdown-body'),
      theme === 'dark' ? nsMd.m('dark') : '',
    ]"
  >
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { wordProps } from './props'
import { computed } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { mergeWith } from 'lodash-es'

import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Image } from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyleKit } from '@tiptap/extension-text-style'
import { KatexInline, KatexBlock } from './katex-slot'
import {
  createBaseProcessor,
  defaultCustomPlugins,
  katexProcess,
  processMarkdownToHtml,
} from '@element-ai-vue/utils'

defineOptions({
  name: 'ElAWord',
})

const props = defineProps({
  ...wordProps,
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '',
  },
})

const ns = useNamespace('word')
const nsMd = useNamespace('markdown')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)

const editor = useEditor({
  content: '',
  editable: !props.disabled,
  extensions: [
    StarterKit,
    KatexInline,
    KatexBlock,
    Image.configure({
      inline: true,
    }),
    Placeholder.configure({
      placeholder: () => props.placeholder,
      showOnlyWhenEditable: false,
    }),
    Highlight.configure({ multicolor: true }),
    TextStyleKit.configure({ textStyle: { mergeNestedSpanStyles: true } }),
    TableKit,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
  ],
})
const processor = computed(() => {
  const plugins = mergeWith([], defaultCustomPlugins)
  return createBaseProcessor(plugins)
})
processMarkdownToHtml(
  katexProcess(
    `# 一级标题
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

`
  ),
  processor.value
).then((html) => {
  editor.value?.commands.setContent(html)
})
</script>
