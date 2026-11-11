# PPT Editor

`ElAPpt` wraps the independent `element-ai-vue-ppt` package. It edits standard OOXML presentations, accepts files, URLs and generation events, and exports PPTX. Legacy PPT conversion and collaboration require a self-hosted service.

This is a development release. Basic objects, slides and a master workspace are implemented; complete Office fidelity, advanced charts/SmartArt and rich-text collaboration are not yet complete.

:::demo PptBase

```vue
<!-- @include: ../../examples/ppt/base.vue -->
```

:::

For standalone use, import `PptEditor` or `createPptEditor` from `element-ai-vue-ppt` and its `style.css`. The package has not been published yet; build and pack it locally. See `packages/ppt-editor/README.md` for input formats, stream framing, Node collaboration and LibreOffice conversion deployment.

Tables support insertion, multiline cell editing, row/column insertion and deletion, and imported grid proportions. Structure edits keep the table frame fixed and are disabled while a cell draft is pending. Merging, splitting and complete table styling remain in progress.
