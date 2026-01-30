<template>
  <div :class="ns.b()" @click="onUploadFile()">
    <slot></slot>
    <input
      ref="inputRef"
      class="upload-input"
      type="file"
      hidden
      :multiple
      :accept="accept?.join()"
      @change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
import { useFileOperation, useNamespace } from '@element-ai-vue/hooks'
import { FilesUploadEmitsType, filesUploadProps } from './props'
import { useVModel } from '@vueuse/core'
import { useTemplateRef } from 'vue'

defineOptions({
  name: 'ElAFilesUpload',
})
const props = defineProps({
  ...filesUploadProps,
})
const emits = defineEmits<FilesUploadEmitsType>()
const inputRef = useTemplateRef('inputRef')
const fileList = useVModel(props, 'modelValue')

const ns = useNamespace('files-upload')

const { handleFileUpload } = useFileOperation(props, fileList)

const onUploadFile = () => {
  if (props.disabled) return
  const fileInput = inputRef.value
  if (fileInput) {
    fileInput.click()
  }
}

const onChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    await handleFileUpload(target.files as unknown as File[])
  }
  const fileInput = inputRef.value
  if (fileInput) {
    fileInput.value = ''
  }
}
</script>
