<template>
  <div>
    <button class="switch-btn" @click="addTitle">title动态添加</button>
    <button class="switch-btn" @click="restTitle">重置标题</button>
  </div>
  <div class="btns">
    <button class="switch-btn" @click="start">开始思考</button>
    <button class="switch-btn" @click="rest">重置思考</button>
  </div>
  <ElAThinking v-model="expanded" :title>
    <div class="thought-chain">
      <ThoughtChainBase></ThoughtChainBase>
    </div>
    <ElAMarkdown
      :content="content"
      :theme="isDark ? 'dark' : 'light'"
    ></ElAMarkdown>
  </ElAThinking>
</template>

<script setup lang="ts">
import { ElAThinking, ElAMarkdown, useTyperwriter } from 'element-ai-vue'
import { useData } from 'vitepress'
import { ref } from 'vue'
import ThoughtChainBase from '../thought-chain/base.vue'

const { isDark } = useData()
const expanded = ref(false)
const title = ref('已完成思考，参考 16 篇资料')

const { content, start, stop, setText } = useTyperwriter({
  interval: 100,
})

setText(`# 一级标题
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

[element-ai-vue](/ "element-ai-vue")`)
const rest = () => {
  stop()
  content.value = ''
}
const addTitle = () => {
  title.value += '动态添加的标题内容，内容较长会自动省略显示'
}
const restTitle = () => {
  title.value = '已完成思考，参考 16 篇资料'
}
</script>

<style scoped>
.thought-chain {
  padding: 0 13px;
}
</style>
