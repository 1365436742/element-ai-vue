import { defineComponent, renderSlot, watch } from 'vue'
import { configProviderProps } from './props'

const ConfigProvider = defineComponent({
  name: 'ElConfigProvider',
  props: configProviderProps,

  setup(props, { slots }) {
    const config = props
    watch(
      () => props.message,
      (val) => {
        Object.assign({}, val ?? {})
      },
      { immediate: true, deep: true }
    )
    return () => renderSlot(slots, 'default', { config: config?.value })
  },
})
export type ConfigProviderInstance = InstanceType<typeof ConfigProvider> &
  unknown

export default ConfigProvider
