import * as Vue from 'vue'
import type { ComponentInternalInstance, ShallowRef } from 'vue'

export type TemplateRef<T = unknown> = Readonly<ShallowRef<T | null>>

/** Vue 3.4 fallback; the mutable ref is required by its renderer's setRef. */
function useTemplateRefFallback<T = unknown>(key: string): TemplateRef<T> {
  const value = Vue.shallowRef<T | null>(null)
  const instance = Vue.getCurrentInstance() as
    | (ComponentInternalInstance & {
        setupState: Record<string, unknown>
      })
    | null

  if (!instance) {
    Vue.warn('useTemplateRef() must be called during setup().')
    return value
  }

  // Vue uses a shared empty object before the first ref is registered.
  const refs = Reflect.ownKeys(instance.refs).length
    ? instance.refs
    : (instance.refs = {})
  const descriptor = Object.getOwnPropertyDescriptor(refs, key)
  if (descriptor && !descriptor.configurable) {
    Vue.warn(`useTemplateRef() already exists for key "${key}".`)
    return value
  }

  Object.defineProperty(refs, key, {
    enumerable: true,
    get: () => value.value,
    set: (next: T | null) => {
      value.value = next
    },
  })

  // uni-mp-vue writes string refs to setupState, not instance.refs.
  // Before mount runs after setup() has returned, including empty/render-function
  // setup results. Unlike a microtask, it also runs before synchronous rendering.
  if (typeof Reflect.get(Vue, 'setTemplateRef') === 'function') {
    Vue.onBeforeMount(() => {
      let state = instance.setupState
      if (!Object.prototype.hasOwnProperty.call(state, key)) {
        if (!Reflect.ownKeys(state).length || !Object.isExtensible(state)) {
          state = instance.setupState = { ...state }
        }
        Object.defineProperty(state, key, {
          enumerable: true,
          configurable: true,
          get: () => value.value,
          set: (next: T | null) => {
            value.value = next
          },
        })
      }
    })
  }

  return value
}

// Dynamic lookup avoids a missing named export error on uni-app's Vue 3.4.
// Newer runtimes retain their own implementation and renderer bookkeeping.
export const useTemplateRef: <T = unknown>(key: string) => TemplateRef<T> =
  Reflect.get(Vue, 'useTemplateRef') ?? useTemplateRefFallback
