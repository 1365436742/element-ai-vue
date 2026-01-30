import { ExtractPropTypes, PropType } from 'vue'
import { defaultFilesUploadProps } from '@element-ai-vue/constants'

export interface FilesUploadItem {
  elementFile?: File
  fileSize?: number
  fileId: string
  fileName: string
  fileUrl: string
  fileExt: string
  uploadingStatus: 'progress' | 'success' | 'error'
  progress?: number
}

export const filesUploadProps = {
  multiple: {
    type: Boolean,
    default: false,
  },
  accept: {
    type: Array as () => string[],
    default: () => [],
  },
  modelValue: {
    type: Array as PropType<FilesUploadItem[]>,
    default: () => [],
  },
  maxFileLength: {
    type: Number,
    default: defaultFilesUploadProps.maxFileLength,
  },
  /* 文件大小限制，单位：MB */
  fileSizeLimit: {
    type: Number,
    default: defaultFilesUploadProps.fileSizeLimit,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  onUploadBefore: {
    type: Function as PropType<(fileList: File[]) => Promise<File[]> | File[]>,
    default: undefined,
  },
  onUpload: {
    type: Function as PropType<
      (fileUploadItems: FilesUploadItem[]) => Promise<any>
    >,
    default: undefined,
  },
  onErrorMessage: {
    type: Function as PropType<(params: FilesUploadErrorParams) => void>,
    default: undefined,
  },
}

/**
 * 错误类型
 * - EXCEED_MAX_FILE_LENGTH: 超出最大文件数量
 * - EXCEED_FILE_SIZE_LIMIT: 超出文件大小限制
 * - INVALID_FILE_TYPE: 非法的文件类型
 */
export type FilesUploadErrorType =
  | 'EXCEED_MAX_FILE_LENGTH'
  | 'EXCEED_FILE_SIZE_LIMIT'
  | 'INVALID_FILE_TYPE'

export type FilesUploadErrorParams = {
  /**
   * 错误类型
   * - EXCEED_MAX_FILE_LENGTH: 超出最大文件数量
   * - EXCEED_FILE_SIZE_LIMIT: 超出文件大小限制
   * - INVALID_FILE_TYPE: 非法的文件类型
   */
  type: FilesUploadErrorType
  message: string
}

export type FilesUploadEmitsType = {
  (e: 'update:modelValue', fileList: FilesUploadItem[]): void
}

export type FilesUploadPropsType = Readonly<
  ExtractPropTypes<typeof filesUploadProps>
>
