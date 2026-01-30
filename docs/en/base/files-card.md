# FilesCard

FilesCard file card component. Works great with DragUpload and FilesUpload.

## Basic Usage

:::demo FilesCardBase

```vue
<!-- @include: ../../examples/files-card/base.vue -->
```

:::

## Custom Extension Icons

Supports overriding built-in file type icons. Currently available icon types: `doc`, `docx`, `pdf`, `default`

:::demo FilesCardOther

```vue
<!-- @include: ../../examples/files-card/other.vue -->
```

:::

::: tip Note
This component uses the same data structure as `DragUpload` and `FilesUpload` v-model. For highly customized needs, you can write your own styles based on the data.
:::

## Props

| Property     | Description              | Type                    | Default                                        |
| ------------ | ------------------------ | ----------------------- | ---------------------------------------------- |
| v-model      | File list binding value  | `FilesUploadItem[]`     | `[]`                                           |
| ext-icon-map | Extended file type icons | `Record<string,string>` | Current icons: `doc`, `docx`, `pdf`, `default` |

## Type Definitions

::: tip Can be imported directly

```typescript
import { FilesUploadItem } from 'element-ai-vue'
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
