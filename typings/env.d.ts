import 'mdast'
import 'hast'
import 'mdast-util-to-hast'
import { MarkdownStorage } from 'tiptap-markdown'
declare module '@tiptap/core' {
  interface Storage {
    markdown: MarkdownStorage
  }
}
