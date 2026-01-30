import { defineComponent, renderSlot, watch } from 'vue'
import { configProviderProps } from './props'
import { provideGlobalConfig } from './provideGlobalConfig'

export const ElAConfigProvider = defineComponent({
  name: 'ElAConfigProvider',
  props: configProviderProps,
  setup(props, { slots }) {
    const config = provideGlobalConfig(props)
    watch(
      () => config?.value.theme,
      (val) => {
        if (val === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    )
    return () => renderSlot(slots, 'default', { config })
  },
})
export type ElAConfigProviderInstance = InstanceType<typeof ElAConfigProvider> &
  unknown

export default ElAConfigProvider
