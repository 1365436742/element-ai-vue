<template>
  <ElAFilesCard v-model="fileList" :ext-icon-map="extIconMap"> </ElAFilesCard>
</template>

<script setup lang="ts">
import { ElAFilesCard, FilesUploadItem } from 'element-ai-vue'
import { ref } from 'vue'

const fileList = ref<FilesUploadItem[]>([
  {
    fileId: '1',
    fileExt: 'excel',
    fileName: '测试文件1.excel',
    fileUrl: '',
    fileSize: 1024 * 1024 * 2,
    progress: 100,
    uploadingStatus: 'success',
  },
  {
    fileId: '2',
    fileExt: 'pdf',
    fileName: '测试文件1测试文件1测试文件1测试文件1测试文件1.pdf',
    fileUrl: '',
    fileSize: 1024 * 1024 * 2,
    progress: 50,
    uploadingStatus: 'progress',
  },
])

const extIconMap = {
  excel: '/logo.svg',
  /** 覆盖原有图标 */
  pdf: '/logo.svg',
}
</script>
