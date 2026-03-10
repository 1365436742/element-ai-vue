import { Editor } from '@tiptap/core'

export const getPlaceholderHeight = (editorInstance?: Editor) => {
  const placeholder = editorInstance?.view.dom.querySelector(
    '[data-placeholder]'
  ) as HTMLElement
  if (placeholder) {
    const style = window.getComputedStyle(placeholder, '::before')
    return style.height || '0px'
  }
  return ''
}
