# DragUpload

DragUpload drag and drop upload component. Its props are the same as FilesUpload, and they can be used together.

## Basic Usage

:::demo DragUploadBase

```vue
<!-- @include: ../../examples/drag-upload/base.vue -->
```

:::

## Custom File Hover Style

:::demo DragUploadSlot

```vue
<!-- @include: ../../examples/drag-upload/slot.vue -->
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

| Slot Name    | Description                                       |
| ------------ | ------------------------------------------------- |
| default      | Custom upload trigger area content                |
| mark-content | Custom style slot for dragging files to drop area |

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
