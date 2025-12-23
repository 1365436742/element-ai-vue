# Sender 输入框

基于 [tiptap](https://tiptap.dev/) 的富文本输入框组件，支持多种扩展和自定义布局。

## 基础用法

:::demo SenderBase

```vue
<template>
  <button class="switch-btn" @click="variant = 'updown'">垂直</button>
  <button class="switch-btn" @click="variant = 'default'">水平</button>
  <div class="wapper" :class="{ 'focus-class': focusClass }">
    <ElASender
      v-model="content"
      :placeholder
      :variant
      @focus="focusClass = true"
      @blur="focusClass = false"
    ></ElASender>
  </div>
</template>

<script setup lang="ts">
import { ElASender } from 'element-ai-vue'
import { ref } from 'vue'

const content = ref(``)
const variant = ref<'default' | 'updown'>('default')
const focusClass = ref(false)
const placeholder = ref(`请输入聊天内容`)
</script>

<style scoped lang="scss">
html.dark {
  .wapper {
    border-color: rgba(121, 121, 121, 0.6);

    &.focus-class {
      border-color: rgba($color: #fff, $alpha: 0.6);
    }
  }
}

.wapper {
  width: 600px;
  border-radius: 8px;
  padding: 8px 7px;
  border: 1px solid rgba(17, 25, 37, 0.15);

  &.focus-class {
    border-color: rgba(17, 25, 37, 0.45);
  }
}
</style>
```

:::

## 插入html

:::demo SenderBaseHtml

```vue
<template>
  <div>
    <button class="switch-btn" @click="variant = 'updown'">垂直</button>
    <button class="switch-btn" @click="variant = 'default'">水平</button>
  </div>

  <div>
    <button class="switch-btn" @click="showInputTagPrefix = true">
      前置标签开启
    </button>
    <button class="switch-btn" @click="showInputTagPrefix = false">
      前置标签关闭
    </button>
    <button class="switch-btn" @click="changeContent('input-slot')">
      input-slot
    </button>
    <button class="switch-btn" @click="changeContent('select-slot')">
      select-slot
    </button>
  </div>

  <div class="wapper" :class="{ 'focus-class': focusClass }">
    <ElASender
      v-model="content"
      v-model:show-input-tag-prefix="showInputTagPrefix"
      inputTagPrefixValue="技能：翻译"
      :placeholder
      :variant
      @focus="focusClass = true"
      @blur="focusClass = false"
    >
    </ElASender>
  </div>
</template>

<script setup lang="ts">
import { ElASender } from 'element-ai-vue'
import { ref } from 'vue'

const content = ref(``)
const variant = ref<'default' | 'updown'>('default')
const focusClass = ref(false)

const placeholder = ref(`请输入聊天内容`)
const showInputTagPrefix = ref(false)

const options = ref([
  { label: '前端开发', value: '1' },
  { label: '设计视觉', value: '2' },
  { label: 'java开发', value: '3' },
])
const temp: Record<string, string> = {
  'input-slot':
    '我是一个<input-slot placeholder="[职业你好我试试]"></input-slot>',
  'select-slot': `我是<select-slot value="3" options='${JSON.stringify(
    options.value
  )}'></select-slot>，帮我完成...`,
}
const changeContent = (key: string) => {
  content.value = temp[key]
}
</script>

<style scoped lang="scss">
html.dark {
  .wapper {
    border-color: rgba(121, 121, 121, 0.6);

    &.focus-class {
      border-color: rgba($color: #fff, $alpha: 0.6);
    }
  }
}

.wapper {
  width: 100%;
  border-radius: 8px;
  padding: 8px;
  border: 1px solid rgba(17, 25, 37, 0.15);

  &.focus-class {
    border-color: rgba(17, 25, 37, 0.45);
  }
}
</style>
```

:::

::: tip 扩展提醒
如果你想扩展更多html类型，可以查看源码方式，自行传入extensions进行扩展使用
:::

## 主题设置

:::demo SenderBaseHtmlDark

```vue
<template>
  <div>
    <button class="switch-btn" @click="variant = 'updown'">垂直</button>
    <button class="switch-btn" @click="variant = 'default'">水平</button>
  </div>

  <div>
    <button class="switch-btn" @click="showInputTagPrefix = true">
      前置标签开启
    </button>
    <button class="switch-btn" @click="showInputTagPrefix = false">
      前置标签关闭
    </button>
    <button class="switch-btn" @click="changeContent('input-slot')">
      input-slot
    </button>
    <button class="switch-btn" @click="changeContent('select-slot')">
      select-slot
    </button>
  </div>
  <div class="box">
    <div class="wapper" :class="{ 'focus-class': focusClass }">
      <ElASender
        v-model="content"
        v-model:show-input-tag-prefix="showInputTagPrefix"
        theme="dark"
        inputTagPrefixValue="技能：翻译"
        :placeholder
        :variant
        @focus="focusClass = true"
        @blur="focusClass = false"
      >
      </ElASender>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElASender } from 'element-ai-vue'
import { ref } from 'vue'

const content = ref(``)
const variant = ref<'default' | 'updown'>('default')
const focusClass = ref(false)

const placeholder = ref(`请输入聊天内容`)
const showInputTagPrefix = ref(false)

const options = ref([
  { label: '前端开发', value: '1' },
  { label: '设计视觉', value: '2' },
  { label: 'java开发', value: '3' },
])
const temp: Record<string, string> = {
  'input-slot':
    '我是一个<input-slot placeholder="[职业你好我试试]"></input-slot>',
  'select-slot': `我是<select-slot value="3" options='${JSON.stringify(
    options.value
  )}'></select-slot>，帮我完成...`,
}
const changeContent = (key: string) => {
  content.value = temp[key]
}
</script>

<style scoped lang="scss">
.box {
  background-color: #000;
  padding: 20px;
  .wapper {
    width: 100%;
    border-radius: 8px;
    padding: 8px;
    border: 1px solid rgba(121, 121, 121, 0.6);

    &.focus-class {
      border-color: rgba($color: #fff, $alpha: 0.6);
    }
  }
}
</style>
```

:::

## @成员 扩展用法

::: tip 扩展提醒
使用tiptap提供的[Mention](https://tiptap.dev/docs/editor/extensions/nodes/mention#page-title)扩展能力。
:::

:::demo SenderExtensions

```vue
<!-- @include: ../../examples/sender/extensions.vue -->
```

:::

:::details ./metion/suggestions 文件

::: code-group

<<< ../../examples/sender/metion/suggestions.ts

<<< ../../examples/sender/metion/MentionList.vue

:::

## 高级聊天输入框

- 通过 CSS 设置输入框最大高度。
- 搭配 `ElADragUpload`、`useFileOperation`、`ElAFilesUpload` 实现拖拽、Ctrl+V 粘贴、点击上传文件。
- 使用 `ElAFilesCard` 实现文件上传回显。

:::demo SenderChat

```vue
<template>
  <button class="switch-btn" @click="variant = 'updown'">垂直</button>
  <button class="switch-btn" @click="variant = 'default'">水平</button>
  <ElADragUpload class="upload-area" v-bind="commonProps" v-model="fileList">
    <div class="area">
      <div class="text-desc">我的区域可以拖拽</div>
      <div class="wapper" :class="{ 'focus-class': focusClass }">
        <div class="file-card" v-if="fileList.length">
          <ElAFilesCard v-model="fileList"></ElAFilesCard>
        </div>
        <ElASender
          v-model="content"
          placeholder="请输入聊天内容"
          class="sender"
          :variant
          @focus="focusClass = true"
          @blur="focusClass = false"
          @paste-file="handleFileUpload"
        >
          <template #action-list>
            <select
              class="model-select"
              :class="{ dark: isDark }"
              placeholder="请选择"
            >
              <option value="chatgpt">chatgpt</option>
              <option value="gemini3">gemini3</option>
              <option value="claude">claude</option>
            </select>
            <button class="upload-btn" :style="{ marginLeft: 'auto' }">
              语音
            </button>
          </template>
          <template #prefix>
            <ElAFilesUpload v-bind="commonProps" v-model="fileList">
              <button class="upload-btn">上传</button>
            </ElAFilesUpload>
          </template>
        </ElASender>
      </div>
    </div>
  </ElADragUpload>
</template>

<script setup lang="ts">
import {
  ElASender,
  ElAFilesUpload,
  ElADragUpload,
  FilesUploadItem,
  ElAFilesCard,
  FilesUploadErrorParams,
  useFileOperation,
} from 'element-ai-vue'
import { ref } from 'vue'

const fileList = ref<FilesUploadItem[]>([])

const content = ref(``)
const variant = ref<'default' | 'updown'>('default')
const focusClass = ref(false)

const mockUpload = (onProgress: (progress: number) => void) => {
  let progress = 0
  const interval = setInterval(() => {
    progress += 30
    onProgress(progress)
    if (progress >= 100) {
      onProgress(100)
      clearInterval(interval)
    }
  }, 500)
}
const onErrorMessage = ({ message, type }: FilesUploadErrorParams) => {
  alert(type + ' ' + message)
}
const onUpload = async (fileUploadItems: FilesUploadItem[]) => {
  for (let i = 0; i < fileUploadItems.length; i++) {
    const element = fileList.value.find(
      (item) => item.fileId === fileUploadItems[i].fileId
    )
    mockUpload((progress) => {
      if (element) {
        element.progress = progress
        if (progress >= 100) {
          element.uploadingStatus = 'success'
          // 这里有cdn链接可以替换掉fileUrl
          // element.fileUrl = "";
        }
      }
    })
  }
}
const commonProps = {
  fileSizeLimit: 1, // 10MB
  maxFileLength: 5,
  accept: ['.pdf', '.docx', '.doc', '.png', '.jpg'],
  onUpload,
  onErrorMessage,
}
const { handleFileUpload } = useFileOperation(commonProps, fileList)
</script>

<style scoped lang="scss">
.input-content {
  margin: 10px 0;
  border: 1px solid #eee;
  padding: 8px;
  border-radius: 4px;
}

.wapper {
  width: 100%;
  border-radius: 8px;
  padding: 8px;
  border: 1px solid rgba(17, 25, 37, 0.15);
  .file-card {
    margin-bottom: 10px;
  }
  &.focus-class {
    border-color: rgba(17, 25, 37, 0.45);
  }
}
.upload-area {
  width: 100%;
  height: 400px;
}

.sender {
  .el-ai-sender__content {
    max-height: 200px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 6px;
      background-color: rgba(144, 147, 153, 0.3);
      &:hover {
        background-color: rgba(144, 147, 153, 0.5);
      }
    }
    &::-webkit-scrollbar-track {
      background-color: transparent;
    }
  }
}

.area {
  box-sizing: border-box;
  padding: 10px;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(17, 25, 37, 0.15);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  .text-desc {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
```

:::

## props

| 属性名                        | 说明                                                                  | 类型                                               | 默认值      |
| ----------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- | ----------- |
| v-model                       | 输入框的html                                                          | `string`                                           | `''`        |
| v-model:show-input-tag-prefix | 是否显示输入框前置标签                                                | `boolean`                                          | `false`     |
| theme                         | 主题                                                                  | `'light' \| 'dark'`                                | `'light'`   |
| placeholder                   | 占位文本                                                              | `string`                                           | `''`        |
| disabled                      | 是否禁用                                                              | `boolean`                                          | `false`     |
| extensions                    | [tiptap](https://tiptap.dev/docs/editor/extensions/overview) 扩展配置 | `Array<Extensions>`                                | `[]`        |
| inputTagPrefixValue           | 输入框前置标签内容                                                    | `string`                                           | `''`        |
| enterBreak                    | 回车是否换行，为 `false` 时回车触发 `enterPressed` 事件               | `boolean`                                          | `false`     |
| onHandleKeyDown               | 自定义键盘事件处理                                                    | `(view: EditorView, event: KeyboardEvent) => void` | -           |
| variant                       | 布局变体                                                              | `'default' \| 'updown'`                            | `'default'` |

## slots

| 插槽名              | 说明                     | 作用域参数                          |
| ------------------- | ------------------------ | ----------------------------------- |
| prefix              | 前置内容插槽             | -                                   |
| input-tag-prefix    | 输入框前置标签自定义内容 | -                                   |
| action-list         | 操作栏列表插槽           | -                                   |
| send-btn            | 发送按钮插槽             | `{ disabled: boolean }`             |
| select-slot-content | select-slot 点击弹窗插槽 | `{ options: SenderSelectOption[] }` |

## events

| 事件名       | 说明                                           | 回调参数                  |
| ------------ | ---------------------------------------------- | ------------------------- |
| enterPressed | 回车键按下时触发（当 `enterBreak` 为 `false`） | -                         |
| paste        | 粘贴时触发                                     | `(event: ClipboardEvent)` |
| pasteFile    | 粘贴文件时触发                                 | `(files: File[])`         |
| blur         | 失去焦点时触发                                 | -                         |
| focus        | 获得焦点时触发                                 | -                         |
| send         | 点击发送按钮或回车发送时触发                   | `(content: string)`       |

## exposes

| 名称   | 说明                                                            | 类型           |
| ------ | --------------------------------------------------------------- | -------------- |
| editor | [tiptap editor](https://tiptap.dev/docs/editor/api/editor) 实例 | () => `Editor` |
| focus  | 自动聚焦                                                        | `void`         |
