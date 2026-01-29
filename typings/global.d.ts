// GlobalComponents for Volar
declare module 'vue' {
  export interface GlobalComponents {
    ElAMarkdown: (typeof import('element-ai-vue'))['ElAMarkdown']
    ElACodeHighlight: (typeof import('element-ai-vue'))['ElACodeHighlight']
    ElABubbleList: (typeof import('element-ai-vue'))['ElABubbleList']
    ElABubble: (typeof import('element-ai-vue'))['ElABubble']
    ElACodeMermaid: (typeof import('element-ai-vue'))['ElACodeMermaid']
    ElADragUpload: (typeof import('element-ai-vue'))['ElADragUpload']
    ElAFilesCard: (typeof import('element-ai-vue'))['ElAFilesCard']
    ElAFilesUpload: (typeof import('element-ai-vue'))['ElAFilesUpload']
    ElASender: (typeof import('element-ai-vue'))['ElASender']
    ElAThinking: (typeof import('element-ai-vue'))['ElAThinking']
    ElAThoughtChain: (typeof import('element-ai-vue'))['ElAThoughtChain']
    ElAConfigProvider: (typeof import('element-ai-vue'))['ElAConfigProvider']
    ElAPpt: (typeof import('element-ai-vue'))['ElAPpt']
    ElAOverflowToolbar: (typeof import('element-ai-vue'))['ElAOverflowToolbar']
  }
}

export {}
