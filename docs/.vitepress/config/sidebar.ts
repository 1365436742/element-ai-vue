import { DefaultTheme } from 'vitepress'

export const zhSidebar: DefaultTheme.Sidebar = [
  {
    text: '',
    items: [
      { text: '快速开始', link: '/zh/start' },
      { text: '简介', link: '/zh/intro' },
    ],
  },
  {
    text: '通用组件',
    items: [
      { text: 'Markdown', link: '/zh/base/markdown' },
      { text: 'Sender 输入框', link: '/zh/base/sender' },
      { text: 'BubbleList 气泡列表', link: '/zh/base/bubble-list' },
    ],
  },
  {
    text: '基础组件',
    items: [
      {
        text: 'Markdown',
        items: [
          { text: 'CodeHighlight 代码高亮', link: '/zh/base/code-highlight' },
          { text: 'CodeMermaid 图表', link: '/zh/base/code-mermaid' },
        ],
      },
      {
        text: 'BubbleList 气泡列表',
        items: [
          { text: 'Bubble 对话气泡', link: '/zh/base/bubble' },
          { text: 'Loading 生成中', link: '/zh/base/loading' },
          { text: 'Thinking 思考', link: '/zh/base/thinking' },
          { text: 'ThoughtChain 思维链', link: '/zh/base/thought-chain' },
        ],
      },
    ],
  },
  {
    text: '文件组件',
    items: [
      { text: 'FilesUpload 文件上传', link: '/zh/base/files-upload' },
      { text: 'DragUpload 拖拽上传', link: '/zh/base/drag-upload' },
      { text: 'FilesCard 文件卡片', link: '/zh/base/files-card' },
    ],
  },
  {
    text: '工具',
    items: [{ text: 'Typewriter 打字器', link: '/zh/base/typewriter' }],
  },
  {
    text: '实验室',
    items: [{ text: 'ppt 编辑', link: '/zh/base/ppt' }],
  },
]
export const enSidebar: DefaultTheme.Sidebar = [
  {
    text: '',
    items: [
      { text: 'Quick Start', link: '/en/start' },
      { text: 'Introduction', link: '/en/intro' },
    ],
  },
  {
    text: 'Common Components',
    items: [
      { text: 'Markdown', link: '/en/base/markdown' },
      { text: 'Sender', link: '/en/base/sender' },
      { text: 'BubbleList', link: '/en/base/bubble-list' },
    ],
  },
  {
    text: 'Basic Components',
    items: [
      {
        text: 'Markdown',
        items: [
          { text: 'CodeHighlight', link: '/en/base/code-highlight' },
          { text: 'CodeMermaid', link: '/en/base/code-mermaid' },
        ],
      },
      {
        text: 'BubbleList',
        items: [
          { text: 'Bubble', link: '/en/base/bubble' },
          { text: 'Loading', link: '/en/base/loading' },
          { text: 'Thinking', link: '/en/base/thinking' },
          { text: 'ThoughtChain', link: '/en/base/thought-chain' },
        ],
      },
    ],
  },
  {
    text: 'File Components',
    items: [
      { text: 'FilesUpload', link: '/en/base/files-upload' },
      { text: 'DragUpload', link: '/en/base/drag-upload' },
      { text: 'FilesCard', link: '/en/base/files-card' },
    ],
  },
  {
    text: 'Tools',
    items: [{ text: 'Typewriter', link: '/en/base/typewriter' }],
  },
  {
    text: 'Laboratory',
    items: [{ text: 'PPT Editor', link: '/en/base/ppt' }],
  },
]
