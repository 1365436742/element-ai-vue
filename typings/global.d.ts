// GlobalComponents for Volar
declare module 'vue' {
  export interface GlobalComponents {
    ElMarkdown: (typeof import('element-ai'))['ElMarkdown']
    ElCodeHighlight: (typeof import('element-ai'))['ElCodeHighlight']
  }
}

export {}
