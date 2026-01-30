<template>
  <ElAThinking v-model="expanded">
    <template #title>
      <div class="title">
        <!-- 注意这里的icon-box图片要包上盒子给上宽度。不然图片会有加载时间无法第一时间拿到图片宽度，导致收缩显示会有问题 -->
        <div class="icon-box">
          <img :src="'/logo.svg'" alt="" />
        </div>
        <span>
          {{ title }}
        </span>
      </div>
    </template>
    <template #action>
      <div class="action" @click="expanded = !expanded">
        {{ expanded ? '收' : '展' }}
      </div>
    </template>
    <ElAMarkdown
      :content="content"
      :theme="isDark ? 'dark' : 'light'"
    ></ElAMarkdown>
  </ElAThinking>
</template>

<script setup lang="ts">
import { ElAThinking, ElAMarkdown } from 'element-ai-vue'
import { useData } from 'vitepress'
import { ref } from 'vue'

const { isDark } = useData()
const expanded = ref(false)
const title = ref('已完成思考，参考 16 篇资料')
const content = ref(`# 一级标题
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
</script>

<style scoped lang="scss">
.title {
  height: 52px;
  display: flex;
  align-items: center;
  .icon-box {
    width: 24px;
    height: 24px;
    margin-right: 8px;
    img {
      width: 100%;
    }
  }
}
.action {
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  white-space: nowrap;
  border-radius: 6px;
}
</style>
