import { computed, getCurrentInstance, inject, provide, ref, unref } from 'vue'

import type { MaybeRef } from '@vueuse/core'
import type { App, Ref } from 'vue'
import { ConfigProviderProps } from './props'
import { localeContextKey, themeContextKey } from '@element-ai-vue/hooks'
import { ConfigProviderPropsKey } from './constants'

const globalConfig = ref<ConfigProviderProps>()
export function useGlobalConfig<
  K extends keyof ConfigProviderProps,
  D extends ConfigProviderProps[K],
>(key: K, defaultValue?: D): Ref<Exclude<ConfigProviderProps[K], undefined> | D>
export function useGlobalConfig(): Ref<ConfigProviderProps>
export function useGlobalConfig(
  key?: keyof ConfigProviderProps,
  defaultValue = undefined
) {
  const config = getCurrentInstance()
    ? inject(ConfigProviderPropsKey, globalConfig)
    : globalConfig
  if (key) {
    return computed(() => config.value?.[key] ?? defaultValue)
  } else {
    return config
  }
}

export const provideGlobalConfig = (
  config: MaybeRef<ConfigProviderProps>,
  app?: App,
  global = false
) => {
  const inSetup = !!getCurrentInstance()
  const oldConfig = inSetup ? useGlobalConfig() : undefined

  const provideFn = app?.provide ?? (inSetup ? provide : undefined)
  if (!provideFn) {
    // eslint-disable-next-line
    console.warn(
      'provideGlobalConfig',
      'provideGlobalConfig() can only be used inside setup().'
    )
    return
  }
  const context = computed(() => {
    const cfg = unref(config)
    if (!oldConfig?.value) return cfg
    return mergeConfig(oldConfig.value, cfg)
  })
  provide(ConfigProviderPropsKey, context)
  provideFn(
    localeContextKey,
    computed(() => context.value.locale)
  )
  provideFn(
    themeContextKey,
    computed(() => context.value.theme)
  )
  if (global || !globalConfig.value) {
    globalConfig.value = context.value
  }
  return context
}

export const keysOf = <T extends object>(arr: T) =>
  Object.keys(arr) as Array<keyof T>

const mergeConfig = (
  a: ConfigProviderProps,
  b: ConfigProviderProps
): ConfigProviderProps => {
  const keys = [...new Set([...keysOf(a), ...keysOf(b)])]
  const obj: Record<string, any> = {}
  for (const key of keys) {
    obj[key] = b[key] !== undefined ? b[key] : a[key]
  }
  return obj
}
