import { strings } from '@element-ai-vue/constants'
import { TextSelection, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
export * from './input-extension'

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

export function getCustomSlotAttribute() {
  return {
    default: true,
    parseHTML: () => true,
    renderHTML: (attributes: any) => ({
      'data-custom-slot': attributes.isCustomSlot ? true : undefined,
    }),
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function removeZeroWidthChar($from: any, tr: Transaction) {
  // Handling zero-width characters before and after pasting
  // Check the previous node of the cursor
  if (
    $from.nodeBefore &&
    $from.nodeBefore.isText &&
    $from.nodeBefore.text === strings.ZERO_WIDTH_CHAR
  ) {
    tr = tr.delete($from.pos - $from.nodeBefore.nodeSize, $from.pos)
    return true
  }
  // Check the node after the cursor
  if (
    $from.nodeAfter &&
    $from.nodeAfter.isText &&
    $from.nodeAfter.text === strings.ZERO_WIDTH_CHAR
  ) {
    tr = tr.delete($from.pos, $from.pos + $from.nodeAfter.nodeSize)
    return true
  }
  return false
}

export function handlePasteLogic(view: EditorView, event: ClipboardEvent) {
  // If there is rich text content, let tiptap handle it by default
  const types = event.clipboardData?.types || []
  const html = event.clipboardData?.getData('text/html')
  if (
    (types.includes('text/html') &&
      ['<input-slot', '<select-slot', '<skill-slot'].some((slot) =>
        html?.includes(slot)
      )) ||
    types.includes('application/x-prosemirror-slice')
  ) {
    return false
  }
  const text = event.clipboardData?.getData('text/plain')
  if (text) {
    const { state, dispatch } = view
    // eslint-disable-next-line prefer-destructuring
    const $from = state.selection.$from
    // eslint-disable-next-line prefer-destructuring
    let tr = state.tr
    const originalFrom = tr.selection.from
    const originalTo = tr.selection.to
    removeZeroWidthChar($from, tr)
    const insertPosFrom = tr.mapping.map(originalFrom)
    const insertPosTo = tr.mapping.map(originalTo)

    /* Use tr to continue the subsequent pasting logic and solve the problem of unsuccessful line wrapping of content 
            pasted from certain web pages, such as the code of Feishu Documents */
    const lines = text.replace(/\r/g, '').split('\n')
    // 去除末尾的空行，防止全选粘贴时产生多余换行
    while (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop()
    }
    let finalCursorPos = null
    if (lines.length === 1) {
      // Insert the first line directly
      tr = tr.insertText(lines[0]!, insertPosFrom || 1, insertPosTo)
      finalCursorPos = (insertPosFrom || 1) + lines[0].length
    } else {
      // other lines, insert one by one
      tr = tr.insertText(lines[0]!, insertPosFrom, insertPosTo)
      let pos = (insertPosFrom || 1) + lines[0].length
      for (let i = 1; i < lines.length; i++) {
        if (state.schema.nodes.hardBreak) {
          const hardBreak = state.schema.nodes.hardBreak.create()
          tr = tr.insert(pos, hardBreak)
          pos += hardBreak.nodeSize
          if (lines[i]) {
            tr = tr.insertText(lines[i], pos)
            pos += lines[i].length
          }
        } else {
          const paragraph = state.schema.nodes.paragraph?.create(
            {},
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            lines[i] ? state.schema.text(lines[i]!) : null
          )
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          tr = tr.insert(pos, paragraph!)
          pos += paragraph?.nodeSize ?? 0
        }
      }
      finalCursorPos = pos // 粘贴多行时，光标应在最后插入内容末尾
    }
    // 设置 selection 到粘贴内容末尾
    tr = tr.setSelection(TextSelection.create(tr.doc, finalCursorPos))
    // scroll to the pasted position
    tr = tr.scrollIntoView()
    dispatch(tr)
    event.preventDefault()
    return true
  }
  return false
}
