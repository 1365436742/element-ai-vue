<template>
  <ElAPpt :source="source" style="height: 680px" @ready="initialize" />
</template>

<script setup lang="ts">
import { ElAPpt } from 'element-ai-vue'
import type { PptEditorHandle } from 'element-ai-vue-ppt'
import 'element-ai-vue-ppt/style.css'

const source = { type: 'new' as const, title: '我的第一份演示文稿' }
async function initialize(editor: PptEditorHandle) {
  const page = editor.getState().scene.slides[0]
  await editor.execute({
    type: 'page.background',
    part: page.part,
    color: '#FAF8F1',
  })
  await editor.execute({
    type: 'object.add',
    part: page.part,
    object: {
      kind: 'text',
      text: '从一个想法开始。',
      frame: { x: 90, y: 230, width: 1100, height: 150 },
      style: { fontSize: 72, color: '#234B3B', bold: true },
    },
  })
}
</script>
