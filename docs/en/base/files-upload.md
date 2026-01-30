# FilesUpload

FilesUpload is a fully-featured file upload component that supports multiple file selection, file type restrictions, and size validation. Suitable for form file uploads, and compared to other component libraries, it's more suited for highly customizable business scenarios.

## Basic Usage

:::demo FilesUploadBase

```vue
<!-- @include: ../../examples/files-upload/base.vue -->
```

:::

## File Restrictions

:::demo FilesUploadAccept

```vue
<!-- @include: ../../examples/files-upload/accept.vue -->
```

:::

## Props

| Property        | Description                                                  | Type                | Default |
| --------------- | ------------------------------------------------------------ | ------------------- | ------- |
| v-model         | File list binding value                                      | `FilesUploadItem[]` | `[]`    |
| multiple        | Whether to support multiple file selection                   | `boolean`           | `false` |
| accept          | Accepted upload file types, e.g., `['.jpg', '.png', '.pdf']` | `string[]`          | `[]`    |
| max-file-length | Maximum number of files to upload                            | `number`            | `10`    |
| file-size-limit | Single file size limit in MB                                 | `number`            | `5`     |
| disabled        | Whether disabled                                             | `boolean`           | `false` |

## Events

| Event Name        | Description                                                | Type                                                   |
| ----------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| upload-before     | Hook before upload, can be used to filter or process files | `(fileList: File[]) => Promise<File[]> \| File[]`      |
| upload            | Custom upload function                                     | `(fileUploadItems: FilesUploadItem[]) => Promise<any>` |
| update:modelValue | Triggered when file list changes                           | `(fileList: FilesUploadItem[]) => void`                |
| error-message     | Triggered on upload error                                  | `(params: FilesUploadErrorParams) => void`             |

## Slots

| Slot Name | Description                        |
| --------- | ---------------------------------- |
| default   | Custom upload trigger area content |

## Type Definitions

::: tip Can be imported directly

```typescript
import {
  FilesUploadItem,
  FilesUploadErrorParams,
  FilesUploadErrorType,
} from 'element-ai-vue'
```

:::

### FilesUploadItem

```typescript
interface FilesUploadItem {
  elementFile?: File // Original File object
  fileSize?: number // File size (bytes)
  fileId: string // File unique identifier
  fileName: string // File name
  fileUrl: string // File URL
  fileExt: string // File extension
  uploadingStatus: 'progress' | 'success' | 'error' // Upload status
  progress?: number // Upload progress (0-100)
}
```

### FilesUploadErrorParams

```typescript
type FilesUploadErrorParams = {
  type: FilesUploadErrorType // Error type
  message: string // Error message
}
```

### FilesUploadErrorType

```typescript
type FilesUploadErrorType =
  | 'EXCEED_MAX_FILE_LENGTH' // Exceeded maximum file count
  | 'EXCEED_FILE_SIZE_LIMIT' // Exceeded file size limit
  | 'INVALID_FILE_TYPE' // Invalid file type
```
