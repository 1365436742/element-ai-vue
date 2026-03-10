# MDocEditor 在线编辑

功能强大的多格式在线协同文档编辑器：

- **多格式导入**：支持直接导入 Markdown (`.md`) 和 Word (`.docx`) 格式的文件。
- **多人实时协作**：支持多人实时在线协同编辑文档。
- **可靠的底层协议**：协同编辑功能基于 [yjs](https://www.npmjs.com/package/yjs) 协议构建，保障了多端数据同步的一致性与高度稳定性。
- **强大的富文本引擎**：核心编辑器基于 [Tiptap](https://tiptap.dev/) 实现，提供灵活、高度定制化的文档编辑体验。
- **丰富的导出选项**：基于 [Tiptap 转换服务](https://tiptap.dev/docs/conversion/export)，不仅支持将文档导出为 Markdown、PDF、Docx、ODT、EPUB、Doc 等多种格式，还支持在导出的文件中添加自定义水印。

## 基础用法

:::demo MDocEditorBase

```vue
<!-- @include: ../../examples/m-doc-editor/base.vue -->
```

:::
