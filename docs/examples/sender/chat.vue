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
        <ShadowBox>
          <ElASender
            class="sender"
            v-model="content"
            placeholder="请输入聊天内容"
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
              <button
                class="upload-btn"
                :class="{ dark: isDark }"
                :style="{ marginLeft: 'auto' }"
              >
                语音
              </button>
            </template>
            <template #prefix>
              <ElAFilesUpload v-bind="commonProps" v-model="fileList">
                <button class="upload-btn" :class="{ dark: isDark }">
                  上传
                </button>
              </ElAFilesUpload>
            </template>
          </ElASender>
        </ShadowBox>
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
import ShadowBox from '../shadow-box.vue'

import { useData } from 'vitepress'
const { isDark } = useData()

const fileList = ref<FilesUploadItem[]>([])

const content = ref(``)
const variant = ref<'default' | 'updown'>('updown')
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
html.dark {
  .wapper {
    border-color: rgba(121, 121, 121, 0.6);

    &.focus-class {
      border-color: rgba($color: #fff, $alpha: 0.6);
    }
  }
  .area {
    border-color: rgba(121, 121, 121, 0.6);
  }
}

.input-content {
  margin: 10px 0;
  border: 1px solid #eee;
  padding: 8px;
  border-radius: 4px;
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
