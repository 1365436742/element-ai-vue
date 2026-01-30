<template>
  <div class="texts">
    <div class="switch-btn no-margin" @click="fileList = []">重置</div>
    <div v-for="item in fileList">{{ item.fileName }}</div>
  </div>
  <div class="btns">
    <div class="upload-area">
      <ElADragUpload v-model="fileList" @upload="onUpload">
        <div class="drag-area">我是上传区域</div>
      </ElADragUpload>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElADragUpload, FilesUploadItem } from 'element-ai-vue'
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
</script>

<style lang="scss">
.texts {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.btns {
  display: flex;
  gap: 20px;
  .upload-area {
    width: 100%;
    height: 200px;
    border: 1px dashed #c0c4cc;
    border-radius: 4px;

    .drag-area {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
