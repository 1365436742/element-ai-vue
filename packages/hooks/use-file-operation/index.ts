import { Ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import {
  FilesUploadPropsType,
  FilesUploadItem,
} from '@element-ai-vue/components/files-upload/props'
import { defaultFilesUploadProps } from '@element-ai-vue/constants'
import { useLocale } from '../use-locale'

export function getFileExtension(fileName: string) {
  return fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase()
}

export const useFileOperation = (
  props: Partial<FilesUploadPropsType>,
  fileList: Ref<FilesUploadItem[]>
) => {
  const { t } = useLocale()
  /**
   * 校验文件格式
   * @param file 文件
   * @returns 是否格式正确
   */
  const validateFormat = (file: File) => {
    if (!props.accept?.length) {
      return false
    }
    return !props.accept?.some((item) => {
      const fileName = file.name.toLocaleLowerCase()
      return fileName.endsWith(item.toLocaleLowerCase())
    })
  }

  /**
   * 文件上传
   * @param files 文件列表
   */
  const handleFileUpload = async (files: File[]) => {
    const {
      maxFileLength = defaultFilesUploadProps.maxFileLength,
      fileSizeLimit = defaultFilesUploadProps.fileSizeLimit,
      accept = [],
    } = props

    if (props.disabled) return
    if (!files) return
    if (fileList.value.length >= maxFileLength) {
      props.onErrorMessage?.({
        type: 'EXCEED_MAX_FILE_LENGTH',
        message: t(
          'el.filesUpload.exceedMaxFileLength',
          `最多只能上传${maxFileLength}个文件`,
          { maxFileLength }
        ),
      })
      return
    }
    const uploadBeforeFiles = (await props?.onUploadBefore?.(files)) || files
    if (uploadBeforeFiles?.length === 0) return
    // 文件可上传数量
    const minLength = Math.min(
      uploadBeforeFiles.length,
      maxFileLength - fileList.value.length
    )
    const curUploadFiles: FilesUploadItem[] = []
    for (let i = 0; i < minLength; i++) {
      const elementFile = uploadBeforeFiles[i]
      const fileId = uuidv4()
      const fileUrl = URL.createObjectURL(elementFile)
      const fileInfo: FilesUploadItem = {
        elementFile,
        fileId,
        fileName: elementFile.name,
        fileUrl,
        fileExt: getFileExtension(elementFile.name),
        fileSize: elementFile.size,
        uploadingStatus: 'progress',
        progress: 0,
      }
      const fileSize = elementFile.size / 1024 / 1024 // 转化为MB

      // 文件格式校验
      if (validateFormat(elementFile)) {
        props.onErrorMessage?.({
          type: 'INVALID_FILE_TYPE',
          message: t(
            'el.filesUpload.invalidFileType',
            `格式不正确,请上传${accept.join('、')}格式`,
            {
              accept: accept.join(', '),
            }
          ),
        })
        return
      }

      // 限制文件大小
      if (fileSize > fileSizeLimit) {
        props.onErrorMessage?.({
          type: 'EXCEED_FILE_SIZE_LIMIT',
          message: t(
            'el.filesUpload.exceedFileSizeLimit',
            `目前仅支持${fileSizeLimit}MB以内文件上传`,
            { fileSizeLimit }
          ),
        })
        return
      }
      curUploadFiles.push(fileInfo)
    }
    fileList.value.push(...curUploadFiles)
    await props.onUpload?.(curUploadFiles)
  }

  return {
    handleFileUpload,
  }
}
