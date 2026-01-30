import type { InjectionKey, Ref } from 'vue'
import { ConfigProviderProps } from './props'

export const ConfigProviderPropsKey: InjectionKey<Ref<ConfigProviderProps>> =
  Symbol()
