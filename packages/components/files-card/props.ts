import { ExtractPropTypes, PropType } from 'vue'
import { FilesUploadItem } from '../files-upload'

export const filesCardProps = {
  modelValue: {
    type: Array as PropType<FilesUploadItem[]>,
    default: () => [],
  },
  extIconMap: {
    type: Object as PropType<{ [key: string]: string }>,
    default: () => ({}),
  },
}

export type FilesCardEmitsType = {
  (e: 'update:modelValue', fileList: FilesUploadItem[]): void
}

export type FilesCardPropsType = Readonly<
  ExtractPropTypes<typeof filesCardProps>
>
