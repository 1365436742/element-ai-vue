# FilesCard 文件卡片

FilesCard 文件卡片组件。搭配DragUpload、FilesUpload使用，事半功倍

## 基础用法

:::demo FilesCardBase

```vue
<!-- @include: ../../examples/files-card/base.vue -->
```

:::

## 自定义扩展图标

支持覆盖组件内部已有的文件类型图标，当前已有图标类型 `doc`、`docx`、`pdf`、`default`

:::demo FilesCardOther

```vue
<!-- @include: ../../examples/files-card/other.vue -->
```

:::

::: tip 提示
改组件用的结构是`DragUpload`、`FilesUpload`的v-model。如果你想你高度自定义，可以通过数据自己写样式
:::

## Props

| 属性名       | 说明               | 类型                    | 默认值                                           |
| ------------ | ------------------ | ----------------------- | ------------------------------------------------ |
| v-model      | 文件列表绑定值     | `FilesUploadItem[]`     | `[]`                                             |
| ext-icon-map | 扩展那文件类型图标 | `Record<string,string>` | 当前已有图标类型 `doc`、`docx`、`pdf`、`default` |

## 类型定义

::: tip 可以直接导入

```typescript
import { FilesUploadItem } from 'element-ai-vue'
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
