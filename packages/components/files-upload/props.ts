import { ExtractPropTypes, PropType } from 'vue'

export interface IFileUploadItem {
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
    type: Array as PropType<IFileUploadItem[]>,
    default: () => [],
  },
  maxFileLength: {
    type: Number,
    default: 10,
  },
  fileSizeLimit: {
    type: Number,
    default: 5, // 单位mb
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
      (fileUploadItems: IFileUploadItem[]) => Promise<any>
    >,
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
  (e: 'update:modelValue', fileList: IFileUploadItem[]): void
  (e: 'error-message', params: FilesUploadErrorParams): void
}

export type FilesUploadPropsType = Readonly<
  ExtractPropTypes<typeof filesUploadProps>
>
