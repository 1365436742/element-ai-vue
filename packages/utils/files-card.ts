import { FilesUploadItem } from '@element-ai-vue/components'

export const parseFileSize = (fileSize: number) => {
  if (fileSize) {
    const fileSizeInMB = fileSize / (1024 * 1024)
    if (fileSizeInMB < 1) {
      const sizeInKB = fileSize / 1024
      return `${sizeInKB.toFixed(2)} KB`
    }
    return `${fileSizeInMB.toFixed(2)} MB`
  }
  return '0 KB'
}

export const isImageFile = (file: FilesUploadItem) => {
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
  return imageExts.includes(file.fileExt.toLowerCase())
}
