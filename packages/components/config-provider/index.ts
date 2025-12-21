import { defineComponent, renderSlot } from 'vue'
import { configProviderProps } from './props'

const ConfigProvider = defineComponent({
  name: 'ElConfigProvider',
  props: configProviderProps,
  setup(props, { slots }) {
    return () => renderSlot(slots, 'default', { config: props })
  },
})
export type ConfigProviderInstance = InstanceType<typeof ConfigProvider> &
  unknown

export default ConfigProvider
