# DragUpload 拖拽上传

DragUpload 拖拽上传组件,他的入参和FilesUpload一样，他们可以搭配使用。

## 基础用法

:::demo DragUploadBase

```vue
<!-- @include: ../../examples/drag-upload/base.vue -->
```

:::

## 自定义文件悬浮样式

:::demo DragUploadSlot

```vue
<!-- @include: ../../examples/drag-upload/slot.vue -->
```

:::

## Props

| 属性名          | 说明                                              | 类型                | 默认值  |
| --------------- | ------------------------------------------------- | ------------------- | ------- |
| v-model         | 文件列表绑定值                                    | `FilesUploadItem[]` | `[]`    |
| multiple        | 是否支持多选文件                                  | `boolean`           | `false` |
| accept          | 接受上传的文件类型，如 `['.jpg', '.png', '.pdf']` | `string[]`          | `[]`    |
| max-file-length | 最大上传文件数量                                  | `number`            | `10`    |
| file-size-limit | 单个文件大小限制，单位 MB                         | `number`            | `5`     |
| disabled        | 是否禁用                                          | `boolean`           | `false` |

## Events

| 事件名            | 说明                                   | 类型                                                   |
| ----------------- | -------------------------------------- | ------------------------------------------------------ |
| upload-before     | 上传前的钩子函数，可用于过滤或处理文件 | `(fileList: File[]) => Promise<File[]> \| File[]`      |
| upload            | 自定义上传函数                         | `(fileUploadItems: FilesUploadItem[]) => Promise<any>` |
| update:modelValue | 文件列表变化时触发                     | `(fileList: FilesUploadItem[]) => void`                |
| error-message     | 上传出错时触发                         | `(params: FilesUploadErrorParams) => void`             |

## Slots

| 插槽名       | 说明                               |
| ------------ | ---------------------------------- |
| default      | 自定义上传触发区域内容             |
| mark-content | 拖拽文件到拖拽区域的自定义样式插槽 |

## 类型定义

::: tip 可以直接导入

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
  elementFile?: File // 原始 File 对象
  fileSize?: number // 文件大小（字节）
  fileId: string // 文件唯一标识
  fileName: string // 文件名
  fileUrl: string // 文件 URL
  fileExt: string // 文件扩展名
  uploadingStatus: 'progress' | 'success' | 'error' // 上传状态
  progress?: number // 上传进度（0-100）
}
```

### FilesUploadErrorParams

```typescript
type FilesUploadErrorParams = {
  type: FilesUploadErrorType // 错误类型
  message: string // 错误信息
}
```

### FilesUploadErrorType

```typescript
type FilesUploadErrorType =
  | 'EXCEED_MAX_FILE_LENGTH' // 超出最大文件数量
  | 'EXCEED_FILE_SIZE_LIMIT' // 超出文件大小限制
  | 'INVALID_FILE_TYPE' // 非法的文件类型
```
