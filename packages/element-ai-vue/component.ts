import { ElAMarkdown } from '@element-ai-vue/components/markdown'
import { ElACodeHighlight } from '@element-ai-vue/components/code-highlight'
import { ElABubbleList } from '@element-ai-vue/components/bubble-list'
import { ElABubble } from '@element-ai-vue/components/bubble'
import { ElACodeEcharts } from '@element-ai-vue/components/code-echarts'
import { ElACodeMermaid } from '@element-ai-vue/components/code-mermaid'
import { ElADrag } from '@element-ai-vue/components/drag'
import { ElAFilesCard } from '@element-ai-vue/components/files-card'
import { ElAFilesUpload } from '@element-ai-vue/components/files-upload'
import { ElAImageGeneration } from '@element-ai-vue/components/image-generation'
import { ElALoading } from '@element-ai-vue/components/loading'
import { ElAPpt } from '@element-ai-vue/components/ppt'
import { ElASender } from '@element-ai-vue/components/sender'
import { ElAThinking } from '@element-ai-vue/components/thinking'
import { ElAThoughtChain } from '@element-ai-vue/components/thought-chain'
import { ElATypewriter } from '@element-ai-vue/components/typewriter'
import { ElAVideoGeneration } from '@element-ai-vue/components/video-generation'

import type { Plugin } from 'vue'

export default [
  ElAMarkdown,
  ElACodeHighlight,
  ElABubbleList,
  ElABubble,
  ElACodeEcharts,
  ElACodeMermaid,
  ElADrag,
  ElAFilesCard,
  ElAFilesUpload,
  ElAImageGeneration,
  ElALoading,
  ElAPpt,
  ElASender,
  ElAThinking,
  ElAThoughtChain,
  ElATypewriter,
  ElAVideoGeneration,
] as Plugin[]
