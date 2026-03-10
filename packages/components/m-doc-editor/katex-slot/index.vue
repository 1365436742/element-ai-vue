<template>
  <node-view-wrapper
    :as="node.type.name === 'katexInline' ? 'span' : 'div'"
    v-html="node.attrs.rawHtml"
  />
</template>

<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

defineProps(nodeViewProps)
</script>
