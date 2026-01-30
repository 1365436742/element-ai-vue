<template>
  <div
    v-if="fileList.length"
    :class="[ns.b(), ns.is('mobile-width', isMobileWidth)]"
  >
    <div
      v-for="(item, index) in fileList"
      :key="item.fileId"
      :class="ns.e('info-item')"
    >
      <div v-if="isImageFile(item)" :class="ns.e('img-info')">
        <img :class="ns.em('img-info', 'img')" :src="item.fileUrl" alt="" />
        <div
          :class="ns.em('img-info', 'mark')"
          v-if="item.uploadingStatus === 'progress'"
        ></div>
        <Progress
          v-if="item.uploadingStatus === 'progress'"
          :class="ns.em('img-info', 'progress')"
          :percentage="item.progress"
          type="circle"
          :show-info="false"
          color="#21B443"
          status="success"
          :stroke-width="2"
          :width="40"
        ></Progress>
        <div
          v-else-if="item.uploadingStatus === 'error'"
          :class="ns.em('img-info', 'error-overlay')"
        >
          {{ t('el.filesCard.uploadError', '上传失败') }}
        </div>
      </div>
      <div v-else :class="ns.e('file-info')">
        <span
          v-if="getMappedIcon(item).startsWith('icon-')"
          :class="[
            ns.em('file-info', 'icon'),
            'element-ai-vue-iconfont',
            getMappedIcon(item),
          ]"
        ></span>
        <img
          v-else-if="getMappedIcon(item)"
          :class="[ns.em('file-info', 'icon')]"
          :src="getMappedIcon(item)"
          alt=""
        />
        <div :class="ns.em('file-info', 'name')">
          <TooltipText :className="item.uploadingStatus">
            {{ item.fileName }}
          </TooltipText>
          <Progress
            v-if="item.uploadingStatus === 'progress'"
            :class="ns.em('file-info', 'progress')"
            :percentage="item.progress"
            type="line"
            :show-info="false"
            color="#21B443"
            status="success"
            :stroke-width="4"
          ></Progress>
          <div
            v-else-if="item.uploadingStatus === 'error'"
            :class="ns.em('file-info', 'error-overlay')"
          >
            {{ t('el.filesCard.uploadError', '上传失败') }}
          </div>
          <div v-else :class="ns.em('file-info', 'desc')">
            <span :class="ns.em('file-info', 'ext')">{{ item.fileExt }}</span>
            <span v-if="item.fileSize" :class="ns.em('file-info', 'ext')">
              {{ parseFileSize(item.fileSize) }}
            </span>
          </div>
        </div>
      </div>
      <span
        v-if="item.uploadingStatus !== 'progress'"
        class="element-ai-vue-iconfont icon-circle-close"
        :class="ns.e('close-icon')"
        @click="removeFile(index)"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { isImageFile, parseFileSize } from '@element-ai-vue/utils'
import { useDevice, useLocale, useNamespace } from '@element-ai-vue/hooks'
import { FilesCardEmitsType, filesCardProps } from './props'
import { FilesUploadItem } from '../files-upload'
import TooltipText from './tooltip-text.vue'
import Progress from './progress.vue'

defineOptions({
  name: 'ElAFilesCard',
})

const props = defineProps({
  ...filesCardProps,
})
const emits = defineEmits<FilesCardEmitsType>()
const { t } = useLocale()
const fileList = useVModel(props, 'modelValue')
const ns = useNamespace('files-card')
const { isMobileWidth } = useDevice()

const removeFile = (index: number) => {
  fileList.value.splice(index, 1)
}

const baseIconMap = {
  doc: 'icon-doc',
  docx: 'icon-docx',
  pdf: 'icon-ppt',
  default: 'icon-file',
}

const getMappedIcon = (file: FilesUploadItem) => {
  const iconMap: Record<string, string> = {
    ...baseIconMap,
    ...props.extIconMap,
  }
  return iconMap[file.fileExt] || iconMap['default']
}
</script>
