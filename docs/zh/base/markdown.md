# Markdown

Markdown 组件的核心基于 `unified` 和 `remark` 生态构建。它通过将 Markdown 文本解析为 AST（抽象语法树），并利用 Vue 的渲染机制将其转换为 DOM 节点。这种架构设计赋予了组件极高的灵活性，支持插槽（Slots）和自定义组件渲染，能够满足复杂的业务需求。

**功能特性：**

- **核心驱动**：基于 `unified` 和 `remark`，解析精准且生态丰富。
- **Vue 渲染**：利用 Vue 渲染 AST，支持 Vue 组件和插槽的无缝嵌入。
- **内置支持**：默认支持数学公式（KaTeX）、代码高亮、Mermaid 流程图/时序图等。
- **可扩展性**：支持自定义扩展，可轻松集成 ECharts 等第三方图表库。
- **组件拆解**：markdown把基本的[代码高亮](/zh/base/code-highlight.html)、[Mermaid](/zh/base/code-mermaid.html)，拆解成两个组件

## 基础用法

:::demo markdownBaseExampls

```vue
<template>
  <ElAMarkdown :content></ElAMarkdown>
</template>
<script setup lang="ts">
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

![示例图片](/logo.svg "一张示例图")

>这是一段引用文本
>
>> 这是嵌套的引用文本
---
| 姓名 | 年龄 | 职业 |
| ---- | ---- | ---- |
| 张三 | 25   | 工程师 |
| 李四 | 30   | 设计师 |
`)
</script>
```

:::

## 基础数学公式

:::demo markdownBaseKatex

```vue
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
## 行内公式

在文本中嵌入数学公式，如：勾股定理 $ a^2 + b^2 = c^2 $，欧拉公式 $ e^{i\\pi} + 1 = 0 $。

圆的面积公式是$ S = \\pi r^2 $，其中 $ r $ 是半径。

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

### 分数和比例

$$
\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}
$$

$$
\\frac{a}{b} = \\frac{c}{d} \\Rightarrow ad = bc
$$

### 求和与积分

#### 求和公式

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

$$
\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}
$$

#### 积分公式

$$
\\int_a^b f(x) dx = F(b) - F(a)
$$

$$
\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\int_0^{\\pi} \\sin x dx = 2
$$

### 微分方程

$$
\\frac{dy}{dx} = ky \\Rightarrow y = Ce^{kx}
$$

$$
\\frac{d^2y}{dx^2} + \\omega^2 y = 0 \\Rightarrow y = A\\cos(\\omega x) + B\\sin(\\omega x)
$$

### 矩阵运算

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}
$$

行列式：

$$
\\det\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix} = ad - bc
$$

### 统计学公式

#### 正态分布

$$
f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}
$$

#### 贝叶斯定理

$$
P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}
$$

#### 标准差

$$
\\sigma = \\sqrt{\\frac{1}{N}\\sum_{i=1}^{N}(x_i - \\mu)^2}
$$

### 三角函数

$$
\\sin^2\\theta + \\cos^2\\theta = 1
$$

$$
\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}
$$

$$
e^{i\\theta} = \\cos\\theta + i\\sin\\theta
$$

### 级数展开

#### 泰勒级数

$$
f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n
$$

#### 指数函数展开

$$
e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!} = 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + \\cdots
$$

#### 正弦函数展开

$$
\\sin x = \\sum_{n=0}^{\\infty} \\frac{(-1)^n x^{2n+1}}{(2n+1)!} = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\cdots
$$

### 复数运算

复数的一般形式： $ z = a + bi $

复数的模： $ |z| = \\sqrt{a^2 + b^2} $

复数的乘法：

$$
(a + bi)(c + di) = (ac - bd) + (ad + bc)i
$$

德摩弗定理：

$$
(\\cos\\theta + i\\sin\\theta)^n = \\cos(n\\theta) + i\\sin(n\\theta)
$$

### 极限

$$
\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1
$$

$$
\\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^x = e
$$

$$
\\lim_{n \\to \\infty} \\sqrt[n]{n} = 1
$$

### 组合数学

排列数： $ P(n,r) = \\frac{n!}{(n-r)!} $

组合数： $ C(n,r) = \\binom{n}{r} = \\frac{n!}{r!(n-r)!} $

二项式定理：

$$
(x + y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^k
$$

### 向量运算

向量的点积： $ \\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta $

向量的叉积： $ \\vec{a} \\times \\vec{b} = |\\vec{a}||\\vec{b}|\\sin\\theta \\vec{n} $

三维向量的叉积：

$$
\\vec{a} \\times \\vec{b} = \\begin{vmatrix}
\\vec{i} & \\vec{j} & \\vec{k} \\\\
a_1 & a_2 & a_3 \\\\
b_1 & b_2 & b_3
\\end{vmatrix}
$$


### 支持的语法格式

本示例支持以下 LaTeX 语法格式：

#### 行内公式
- 使用单个：$E=mc^2$
- 使用 ( ) 包围：(a^2+b^2=c^2)
- 使用两个并带有 \`\n\`：$\n E=mc^2 \n$
- 使用 [ ] 包围：[\n a^2+b^2=c^2 \n]
- 使用 [ \\n ] 语法：[ E=mc^2 ]

#### 块级公式
- 使用包围：
$$
int_a^b f(x)dx = F(b) - F(a)
$$

- 使用 [ ] 包围：[ sum_{i=1}^n i = \frac{n(n+1)}{2} ]

> **注意**：LaTeX 公式的渲染依赖于 KaTeX 库，确保已正确配置相关依赖。
`)
</script>
```

:::

## 插槽-自定义工具栏

:::demo markdownCodeSlotExampls

```vue
<!-- @include: ../../examples/markdown/code-slot-exampls.vue -->
```

:::

## 插槽-自定义代码块使用echarts

:::demo markdownCustomCodeArea

```vue
<!-- @include: ../../examples/markdown/custom-code-area.vue -->
```

:::

:::details 自定义echart文件示例 ./echarts-test.vue
<<< @/examples/markdown/echarts-test.vue
:::

## 打字机输出

:::demo markdownTypewriter

```vue
<template>
  <div class="btns">
    <button class="switch-btn" @click="start">开始</button>
    <button class="switch-btn" @click="paused">暂停</button>
    <button class="switch-btn" @click="stop">停止</button>
  </div>
  <ElAMarkdown :content="content"></ElAMarkdown>
</template>
<script setup lang="ts">
import { useTyperwriter, ElAMarkdown } from 'element-ai-vue'
const { start, paused, stop, setText, content } = useTyperwriter({
  interval: 50,
})

const allText = `
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

# js代码块
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
`
setText(allText)
</script>
```

:::

## props

| 属性名             | 说明                                                                    | 类型                     | 默认值    |
| ------------------ | ----------------------------------------------------------------------- | ------------------------ | --------- |
| theme              | 主题模式                                                                | `'dark' \| 'light'`      | `'light'` |
| content            | Markdown 内容                                                           | `string`                 | `''`      |
| remarkPlugins      | 自定义 remark 插件                                                      | `MiddlewarePluginItem[]` | `[]`      |
| codeHighlightProps | 传递给 [`CodeHighlight`](/zh/base/code-highlight.html#props) 组件的属性 | `CodeHighlightPropsType` | `{}`      |
| codeMermaidProps   | 传递给 [`CodeMermaid`](/zh/base/code-mermaid.html#props) 组件的属性     | `CodeMermaidPropsType`   | `{}`      |

## slot

| 插槽名                          | 说明                      | 参数                                                               |
| ------------------------------- | ------------------------- | ------------------------------------------------------------------ |
| mermaid                         | 自定义 Mermaid 代码块渲染 | `{ content, language, theme, ...codeMermaidProps }`                |
| code-mermaid-toolbar            | 自定义 Mermaid 工具栏     | 参见 [`CodeMermaid`](/zh/base/code-mermaid.html#slot) 组件文档     |
| code-mermaid-fullscreen-toolbar | 自定义 Mermaid 全屏工具栏 | 参见 [`CodeMermaid`](/zh/base/code-mermaid.html#slot) 组件文档     |
| code                            | 自定义代码块渲染          | `{ content, language, theme, ...codeHighlightProps }`              |
| code-highlight-header           | 自定义代码块头部          | 参见 [`CodeHighlight`](/zh/base/code-highlight.html#slot) 组件文档 |
