import * as Y from 'yjs'
import { decodeBytes, encodeBytes } from './protocol.js'
/** Changes only the edited span, retaining CRDT identities for the common prefix/suffix. */
export function replaceText(doc: Y.Doc, value: string) {
  const text = doc.getText('content'),
    old = text.toString()
  let prefix = 0,
    suffix = 0
  while (
    prefix < old.length &&
    prefix < value.length &&
    old[prefix] === value[prefix]
  )
    prefix++
  while (
    suffix < old.length - prefix &&
    suffix < value.length - prefix &&
    old[old.length - 1 - suffix] === value[value.length - 1 - suffix]
  )
    suffix++
  doc.transact(() => {
    const count = old.length - prefix - suffix
    if (count) text.delete(prefix, count)
    const insert = value.slice(prefix, value.length - suffix)
    if (insert) text.insert(prefix, insert)
  })
}
export function loadText(state?: string, value = '') {
  const doc = new Y.Doc()
  if (state) Y.applyUpdate(doc, decodeBytes(state))
  else if (value) doc.getText('content').insert(0, value)
  return doc
}
export function textState(doc: Y.Doc) {
  return encodeBytes(Y.encodeStateAsUpdate(doc))
}
export function textChange(state: string, value: string) {
  const doc = loadText(state),
    before = Y.encodeStateVector(doc)
  replaceText(doc, value)
  const update = encodeBytes(Y.encodeStateAsUpdate(doc, before))
  doc.destroy()
  return update
}
