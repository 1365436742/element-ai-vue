# Sender Input

A rich text input component based on [tiptap](https://tiptap.dev/), supporting various extensions and custom layouts.

## Basic Usage

:::demo SenderBase

```vue
<template>
  <button class="switch-btn" @click="variant = 'updown'">Vertical</button>
  <button class="switch-btn" @click="variant = 'default'">Horizontal</button>
  <button class="switch-btn" @click="loading = true">Loading</button>
  <button class="switch-btn" @click="inputRef?.focus()">Auto Focus</button>
  <button class="switch-btn" @click="getTextContent()">Get Input Text</button>
  <button class="switch-btn" @click="getJSONContent()">Get Input JSON</button>

  <div class="input-content" v-if="inputContent">{{ inputContent }}</div>

  <div class="wapper" :class="{ 'focus-class': focusClass }">
    <ElASender
      ref="inputRef"
      v-model="content"
      v-model:loading="loading"
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
import { ref, useTemplateRef } from 'vue'

const content = ref(``)
const variant = ref<'default' | 'updown'>('default')
const focusClass = ref(false)
const placeholder = ref(`Please enter chat content`)
const inputRef = useTemplateRef('inputRef')
const loading = ref(false)

const inputContent = ref('')

const getTextContent = () => {
  inputContent.value = inputRef.value?.editor()?.getText() || ''
}
const getJSONContent = () => {
  inputContent.value = JSON.stringify(inputRef.value?.editor()?.getJSON()) || ''
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

  &.focus-class {
    border-color: rgba(17, 25, 37, 0.45);
  }
}
</style>
```

:::

::: tip Extension Reminder
If you want to extend more HTML types, please refer to the source code and pass in `extensions` for customization.
:::

## Theme Settings

:::demo SenderBaseHtmlDark

```vue
<template>
  <div>
    <button class="switch-btn" @click="variant = 'updown'">Vertical</button>
    <button class="switch-btn" @click="variant = 'default'">Horizontal</button>
  </div>

  <div>
    <button class="switch-btn" @click="showInputTagPrefix = true">
      Enable Prefix Tag
    </button>
    <button class="switch-btn" @click="showInputTagPrefix = false">
      Disable Prefix Tag
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
        inputTagPrefixValue="Skill: Translation"
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

const placeholder = ref(`Please enter chat content`)
const showInputTagPrefix = ref(false)

const options = ref([
  { label: 'Frontend Dev', value: '1' },
  { label: 'Visual Design', value: '2' },
  { label: 'Java Dev', value: '3' },
])
const temp: Record<string, string> = {
  'input-slot':
    'I am a <input-slot placeholder="[Job Hello Test]"></input-slot>',
  'select-slot': `I am <select-slot value="3" options='${JSON.stringify(
    options.value
  )}'></select-slot>, help me complete...`,
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

## @Member Extension Usage

::: tip Extension Reminder
Uses the [Mention](https://tiptap.dev/docs/editor/extensions/nodes/mention#page-title) extension provided by Tiptap.
:::

:::demo SenderExtensions

```vue
<!-- @include: ../../examples/sender/extensions.vue -->
```

:::

:::details ./metion/suggestions file

::: code-group

<<< ../../examples/sender/metion/suggestions.ts

<<< ../../examples/sender/metion/MentionList.vue

:::

## Advanced Chat Input

- Set the maximum height of the input box via CSS.
- Combine with `ElADragUpload`, `useFileOperation`, and `ElAFilesUpload` to implement drag-and-drop, Ctrl+V pasting, and click-to-upload.
- Use `ElAFilesCard` to display uploaded files.

:::demo SenderChat

```vue
<template>
  <button class="switch-btn" @click="variant = 'updown'">Vertical</button>
  <button class="switch-btn" @click="variant = 'default'">Horizontal</button>
  <ElADragUpload class="upload-area" v-bind="commonProps" v-model="fileList">
    <div class="area">
      <div class="text-desc">My area is draggable</div>
      <div class="wapper" :class="{ 'focus-class': focusClass }">
        <div class="file-card" v-if="fileList.length">
          <ElAFilesCard v-model="fileList"></ElAFilesCard>
        </div>
        <ElASender
          v-model="content"
          placeholder="Please enter chat content"
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
              placeholder="Please select"
            >
              <option value="chatgpt">chatgpt</option>
              <option value="gemini3">gemini3</option>
              <option value="claude">claude</option>
            </select>
            <button class="upload-btn" :style="{ marginLeft: 'auto' }">
              Voice
            </button>
          </template>
          <template #prefix>
            <ElAFilesUpload v-bind="commonProps" v-model="fileList">
              <button class="upload-btn">Upload</button>
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
          // You can replace fileUrl with a CDN link here
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

| Attribute                     | Description                                                                                  | Type                                               | Default     |
| ----------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------- |
| v-model                       | HTML content of the input box                                                                | `string`                                           | `''`        |
| v-model:show-input-tag-prefix | Whether to show the input box prefix tag                                                     | `boolean`                                          | `false`     |
| v-model:loading               | Sending status; style can be customized via slot                                             | `boolean`                                          | `false`     |
| theme                         | Theme                                                                                        | `'light' \| 'dark'`                                | `'light'`   |
| placeholder                   | Placeholder text                                                                             | `string`                                           | `''`        |
| disabled                      | Whether disabled                                                                             | `boolean`                                          | `false`     |
| extensions                    | [tiptap](https://tiptap.dev/docs/editor/extensions/overview) extension configuration         | `Array<Extensions>`                                | `[]`        |
| inputTagPrefixValue           | Content of the input box prefix tag                                                          | `string`                                           | `''`        |
| enterBreak                    | Whether Enter key inserts a line break. If `false`, Enter triggers the `enterPressed` event. | `boolean`                                          | `false`     |
| onHandleKeyDown               | Custom keyboard event handling                                                               | `(view: EditorView, event: KeyboardEvent) => void` | -           |
| variant                       | Layout variant                                                                               | `'default' \| 'updown'`                            | `'default'` |

## slots

| Slot Name           | Description                             | Scoped Arguments                    |
| ------------------- | --------------------------------------- | ----------------------------------- |
| prefix              | Prefix content slot                     | -                                   |
| input-tag-prefix    | Custom content for input box prefix tag | -                                   |
| action-list         | Action bar list slot                    | -                                   |
| send-btn            | Send button slot                        | `{ disabled: boolean }`             |
| send-btn-loading    | Displayed when loading is true          | -                                   |
| select-slot-content | Popup slot for select-slot clicks       | `{ options: SenderSelectOption[] }` |

## events

| Event Name   | Description                                                        | Callback Arguments        |
| ------------ | ------------------------------------------------------------------ | ------------------------- |
| enterPressed | Triggered when Enter key is pressed (when `enterBreak` is `false`) | -                         |
| paste        | Triggered on paste                                                 | `(event: ClipboardEvent)` |
| pasteFile    | Triggered on file paste                                            | `(files: File[])`         |
| blur         | Triggered on blur                                                  | -                         |
| focus        | Triggered on focus                                                 | -                         |
| send         | Triggered when clicking the send button or pressing Enter to send  | `(content: string)`       |

## exposes

| Name   | Description                                                         | Type           |
| ------ | ------------------------------------------------------------------- | -------------- |
| editor | [tiptap editor](https://tiptap.dev/docs/editor/api/editor) instance | () => `Editor` |
| focus  | Auto focus                                                          | `void`         |
