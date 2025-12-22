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
    ElALoading: (typeof import('element-ai-vue'))['ElALoading']
    ElAPpt: (typeof import('element-ai-vue'))['ElAPpt']
    ElASender: (typeof import('element-ai-vue'))['ElASender']
    ElAThinking: (typeof import('element-ai-vue'))['ElAThinking']
    ElAThoughtChain: (typeof import('element-ai-vue'))['ElAThoughtChain']
  }
}

export {}
