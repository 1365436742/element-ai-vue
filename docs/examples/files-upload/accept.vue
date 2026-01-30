<template>
  <div class="texts">
    <div class="switch-btn no-margin" @click="fileList = []">重置</div>
    <div v-for="item in fileList">{{ item.fileName }}</div>
  </div>
  <div class="btns">
    <ElAFilesUpload
      v-model="fileList"
      @upload="onUpload"
      :accept="['.png', '.jpg']"
    >
      <button class="switch-btn no-margin">限制文件类型</button>
    </ElAFilesUpload>
    <ElAFilesUpload
      v-model="fileList"
      @upload="onUpload"
      :file-size-limit="1"
      @error-message="onErrorMessage"
    >
      <button class="switch-btn no-margin">限制文件大小</button>
    </ElAFilesUpload>
    <ElAFilesUpload
      v-model="fileList"
      @upload="onUpload"
      :file-size-limit="1"
      :max-file-length="1"
      @error-message="onErrorMessage"
    >
      <button class="switch-btn no-margin">限制文件数量</button>
    </ElAFilesUpload>
  </div>
</template>

<script setup lang="ts">
import {
  ElAFilesUpload,
  FilesUploadErrorParams,
  FilesUploadItem,
} from 'element-ai-vue'
import { ref } from 'vue'

const fileList = ref<FilesUploadItem[]>([])

const onUpload = async (fileUploadItems: FilesUploadItem[]) => {
  for (let i = 0; i < fileUploadItems.length; i++) {
    const element = fileList.value.find(
      (item) => item.fileId === fileUploadItems[i].fileId
    )
    // eslint-disable-next-line
    console.log('fileUploadItems', element)
  }
}

const onErrorMessage = ({ message, type }: FilesUploadErrorParams) => {
  alert(type + ' ' + message)
}
</script>

<style>
.texts {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.btns {
  display: flex;
  gap: 20px;
}
</style>
