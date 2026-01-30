<template>
  <div ref="dropZoneRef" :class="ns.b()">
    <div :class="ns.e('content')">
      <slot></slot>
    </div>
    <div v-if="isOverDropZone && !props.disabled" :class="ns.e('drop-mask')">
      <slot name="mark-content">
        <div :class="ns.e('drop-mask-border')">
          <p :class="ns.e('drop-content-first')">
            {{ t('el.dragUpload.text', '将文档拖拽到此区域上传') }}
          </p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useFileOperation,
  useLocale,
  useNamespace,
} from '@element-ai-vue/hooks'
import { FilesUploadEmitsType, filesUploadProps } from '../files-upload'
import { useDropZone, useVModel } from '@vueuse/core'
import { useTemplateRef } from 'vue'

defineOptions({
  name: 'ElADragUpload',
})
const props = defineProps({
  ...filesUploadProps,
})
const { t } = useLocale()
const emits = defineEmits<FilesUploadEmitsType>()
const fileList = useVModel(props, 'modelValue')
const dropZoneRef = useTemplateRef('dropZoneRef')
const ns = useNamespace('drag-upload')
const { handleFileUpload } = useFileOperation(props, fileList)
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop(droppedFiles) {
    if (droppedFiles) {
      handleFileUpload(droppedFiles)
    }
  },
})
</script>
