import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import * as Vue from 'vue'
import { useTemplateRef as nativeRef } from '../dist/runtime.mjs'

// Load the distributed runtime against a minimal Vue 3.4-shaped runtime. This
// exercises the fallback even when the workspace itself uses Vue 3.5.
const source = await readFile(
  new URL('../dist/runtime.mjs', import.meta.url),
  'utf8'
)
const mockUrl =
  'data:text/javascript;base64,' +
  Buffer.from(
    `
  let instance = null
  export const hooks = []
  export const warnings = []
  export function getCurrentInstance() { return instance }
  export function setInstance(value) { instance = value; hooks.length = 0; warnings.length = 0 }
  export function shallowRef(value) { return { __v_isRef: true, value } }
  export function onBeforeMount(callback) { hooks.push(callback) }
  export function warn(message) { warnings.push(message) }
  export function setTemplateRef({ r }, value, state) {
    if (typeof r === 'string' && Object.hasOwn(state, r)) state[r] = value
    else if (r && r.__v_isRef) r.value = value
  }
`
  ).toString('base64')
const mock = await import(mockUrl)
const patched = source.replace(/from "vue"/, `from ${JSON.stringify(mockUrl)}`)
const { useTemplateRef } = await import(
  'data:text/javascript;base64,' + Buffer.from(patched).toString('base64')
)

test('preserves native Vue 3.5 implementation', () => {
  assert.equal(nativeRef, Vue.useTemplateRef)
})

test('H5 string refs update, remain shallow and clear on unmount', () => {
  const instance = { refs: Object.freeze({}), setupState: {} }
  mock.setInstance(instance)
  const el = useTemplateRef('el')
  const other = useTemplateRef('other')
  assert.equal(el.value, null)
  const node = { nested: {} }
  instance.refs.el = node
  assert.equal(el.value, node)
  assert.equal(other.value, null)
  instance.refs.el = null
  assert.equal(el.value, null)
})

test('mini-program string refs bind after setup, including empty setup state', () => {
  for (const setupState of [{}, Object.freeze({}), { existing: 1 }]) {
    const instance = { refs: {}, setupState: Object.freeze({}) }
    mock.setInstance(instance)
    const componentRef = useTemplateRef('child')
    instance.setupState = setupState
    mock.hooks.forEach((hook) => hook())
    const child = { exposed: true }
    mock.setTemplateRef({ r: 'child' }, child, instance.setupState)
    assert.equal(componentRef.value, child)
    assert.equal(instance.refs.child, child)
    mock.setTemplateRef({ r: 'child' }, null, instance.setupState)
    assert.equal(componentRef.value, null)
  }
})

test('ref objects from compiled templates remain writable by the old renderer', () => {
  mock.setInstance({ refs: {}, setupState: {} })
  const ref = useTemplateRef('child')
  mock.setTemplateRef({ r: ref }, { id: 1 }, {})
  assert.equal(ref.value.id, 1)
  mock.setTemplateRef({ r: ref }, null, {})
  assert.equal(ref.value, null)
})

test('does not overwrite existing setup bindings or share refs across instances', () => {
  const first = { refs: {}, setupState: { child: 123 } }
  mock.setInstance(first)
  const a = useTemplateRef('child')
  mock.hooks.forEach((hook) => hook())
  assert.equal(first.setupState.child, 123)
  mock.setInstance({ refs: {}, setupState: {} })
  const b = useTemplateRef('child')
  first.refs.child = 'first'
  assert.equal(a.value, 'first')
  assert.equal(b.value, null)
})

test('warns for duplicate keys and calls outside setup', () => {
  const instance = { refs: {}, setupState: {} }
  mock.setInstance(instance)
  const original = useTemplateRef('child')
  const duplicate = useTemplateRef('child')
  instance.refs.child = 'value'
  assert.equal(original.value, 'value')
  assert.equal(duplicate.value, null)
  assert.match(mock.warnings[0], /already exists/)
  mock.setInstance(null)
  assert.equal(useTemplateRef('outside').value, null)
  assert.match(mock.warnings[0], /setup/)
})
