import type { EditorView } from 'prosemirror-view'

export const handleSenderPasteLogic = (
  view: EditorView,
  event: ClipboardEvent
) => {
  const text = event.clipboardData?.getData('text/plain')
  if (text) {
    // 将换行符替换为空格
    const cleanedText = text.replace(/[\r\n]+/g, ' ')
    // 插入处理后的文本
    const { state, dispatch } = view
    const { tr } = state
    tr.insertText(cleanedText)
    dispatch(tr)
    event.preventDefault()
    return true
  }
  return false
}

export const getParseFile = (e: ClipboardEvent) => {
  // To support file paste
  const items = e.clipboardData?.items
  const files: File[] = []
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const file = it.getAsFile()
      if (file) {
        files.push(file)
      }
    }
  }
  if (files.length) {
    return files
  }
}
