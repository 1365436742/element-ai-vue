// 简化的 KaTeX 配置
export const katexConfig = {
  throwOnError: false,
  errorColor: '#cc0000',
  strict: false,
  macros: {
    // 添加一些常用宏
    '\\RR': '\\mathbb{R}',
    '\\NN': '\\mathbb{N}',
    '\\ZZ': '\\mathbb{Z}',
    '\\CC': '\\mathbb{C}',
    '\\QQ': '\\mathbb{Q}',
  },
}
