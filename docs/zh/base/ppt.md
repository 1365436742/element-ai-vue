# PPT 演示文稿编辑

`ElAPpt` 基于独立包 `element-ai-vue-ppt`，支持本地 PPTX 编辑、链接输入、流式内容预览及标准 PPTX 导出。旧版 PPT 和多人协作需要配置自部署服务。

当前为开发版。已实现基础对象编辑、页面管理和母版工作区；复杂图表、SmartArt、完整富文本协作和全部 Office 特性尚未完成，不能视为 PowerPoint 的完整替代。

## 基础用法

:::demo PptBase

```vue
<!-- @include: ../../examples/ppt/base.vue -->
```

:::

## 输入方式

`source` 可传入 URL 字符串、File、Blob、ArrayBuffer，或结构化输入：

```ts
{ type: 'url', url: '/demo.pptx', request: { headers: {} } }
{ type: 'binary-stream', stream, fileName: 'demo.pptx' }
{ type: 'events', events: asyncIterable, mode: 'replace' }
{ type: 'new', title: '新建演示文稿' }
```

PPTX 字节流下载完成后才能解析。内容事件流可以逐步预览，生成期间禁止人工编辑，收到显式完成事件后解除锁定。NDJSON/SSE 是传输封装，文档存储与导出仍为 OOXML。

## 独立使用

```ts
import { PptEditor, createPptEditor } from 'element-ai-vue-ppt'
import 'element-ai-vue-ppt/style.css'
```

按需引入主库组件时也需引入 `element-ai-vue-ppt/style.css`；主库完整 CSS 已包含该样式。核心包当前尚未发布，可在仓库构建并打包使用。

## API

| 属性     | 说明                             | 默认值       |
| -------- | -------------------------------- | ------------ |
| source   | 文档输入                         | 新建空白文档 |
| editable | 是否允许人工编辑                 | true         |
| options  | 初始配置：协作、转换服务、主题等 | {}           |

| 事件   | 参数         |
| ------ | ------------ |
| ready  | 编辑器控制器 |
| change | EditorState  |
| error  | 异常         |

实例方法：`open`、`execute`、`getState`、`exportFile`（返回 Blob）、`undo`、`redo`、`setWorkspace`、`applyGenerationEvent`、`cancelGeneration`、`resolveDraft`。服务部署、流式协议和能力边界参见仓库 `packages/ppt-editor/README.md` 与 `STATUS.md`。

表格支持插入、逐格多行文字编辑、行列增删，并按导入文件的列宽和行高比例预览。行列操作保持外框；有未保存草稿时禁用结构修改。合并拆分及完整表格样式仍在实现中。
