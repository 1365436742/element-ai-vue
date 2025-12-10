<template>
  <div v-html="htmlContent"></div>
</template>

<script setup lang="ts">
import { commonLangs } from '@element-ai/constants'
import { getHighlighter, HighlighterType } from '@element-ai/utils'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: '',
  },
})
const htmlContent = ref('')
const highlighter = ref<HighlighterType | null>(null)

onMounted(async () => {
  highlighter.value = await getHighlighter()
})

watch(
  [() => props.content, () => highlighter.value],
  async () => {
    if (!highlighter.value) return
    const hasLang = commonLangs.includes(props.language || '')
    const html = await highlighter.value.codeToHtml(props.content, {
      lang: hasLang ? props.language : 'plaintext',
      theme: 'github-light',
    })
    htmlContent.value = html
  },
  { immediate: true }
)
</script>
