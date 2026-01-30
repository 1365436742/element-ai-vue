<template>
  <ElAFilesCard v-model="fileList"> </ElAFilesCard>
</template>

<script setup lang="ts">
import { ElAFilesCard, FilesUploadItem } from 'element-ai-vue'
import { ref } from 'vue'

const fileList = ref<FilesUploadItem[]>([
  {
    fileId: '1',
    fileExt: 'pdf',
    fileName: '测试文件1测试文件1测试文件1测试文件1测试文件1.pdf',
    fileUrl: '',
    fileSize: 1024 * 1024 * 2,
    progress: 50,
    uploadingStatus: 'progress',
  },
  {
    fileId: '1',
    fileExt: 'pdf',
    fileName: '测试文件1.pdf',
    fileUrl: '',
    fileSize: 1024 * 1024 * 2,
    progress: 50,
    uploadingStatus: 'success',
  },
  {
    fileId: '3',
    fileExt: 'docx',
    fileName: '测试文件1.docx',
    fileUrl: '',
    progress: 60,
    uploadingStatus: 'error',
  },
  {
    fileId: '4',
    fileExt: 'text',
    fileName: '测试文件1.text',
    fileUrl: '',
    progress: 60,
    uploadingStatus: 'progress',
  },
  {
    fileId: '6',
    fileExt: 'excel',
    fileName: '图片文件2.excel',
    fileUrl: '',
    progress: 100,
    uploadingStatus: 'progress',
  },
  {
    fileId: '5',
    fileExt: 'png',
    fileName: '图片文件2.png',
    fileUrl: '/logo.svg',
    progress: 80,
    uploadingStatus: 'progress',
  },
  {
    fileId: '5',
    fileExt: 'png',
    fileName: '图片文件2.png',
    fileUrl: '/logo.svg',
    progress: 100,
    uploadingStatus: 'error',
  },
  {
    fileId: '5',
    fileExt: 'png',
    fileName: '图片文件2.png',
    fileUrl: '/logo.svg',
    progress: 100,
    uploadingStatus: 'success',
  },
])
</script>
