import { ElAMarkdown } from '@element-ai-vue/components/markdown'
import { ElACodeHighlight } from '@element-ai-vue/components/code-highlight'
import { ElABubbleList } from '@element-ai-vue/components/bubble-list'
import { ElABubble } from '@element-ai-vue/components/bubble'
import { ElACodeMermaid } from '@element-ai-vue/components/code-mermaid'
import { ElADragUpload } from '@element-ai-vue/components/drag-upload'
import { ElAFilesCard } from '@element-ai-vue/components/files-card'
import { ElAFilesUpload } from '@element-ai-vue/components/files-upload'
import { ElAPpt } from '@element-ai-vue/components/ppt'
import { ElASender } from '@element-ai-vue/components/sender'
import { ElAThinking } from '@element-ai-vue/components/thinking'
import { ElAThoughtChain } from '@element-ai-vue/components/thought-chain'
import { ElAConfigProvider } from '@element-ai-vue/components/config-provider'
import { ElAOverflowToolbar } from '@element-ai-vue/components/overflow-toolbar'
import { ElAMDocEditor } from '@element-ai-vue/components/m-doc-editor'
import { ElAConversations } from '@element-ai-vue/components/conversations'
import { ElAConversationItem } from '@element-ai-vue/components/conversation-item'
import { ElAConversationCreate } from '@element-ai-vue/components/conversation-create'
import { ElAConversationMenu } from '@element-ai-vue/components/conversation-menu'
import { ElAConversationPopover } from '@element-ai-vue/components/conversation-popover'

import type { Plugin } from 'vue'

export default [
  ElAMarkdown,
  ElACodeHighlight,
  ElABubbleList,
  ElABubble,
  ElACodeMermaid,
  ElADragUpload,
  ElAFilesCard,
  ElAFilesUpload,
  ElAPpt,
  ElASender,
  ElAThinking,
  ElAThoughtChain,
  ElAConfigProvider,
  ElAOverflowToolbar,
  ElAMDocEditor,
  ElAConversations,
  ElAConversationItem,
  ElAConversationCreate,
  ElAConversationMenu,
  ElAConversationPopover,
] as Plugin[]
