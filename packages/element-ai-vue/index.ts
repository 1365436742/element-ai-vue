import installer from './defaults'

export * from '@element-ai-vue/components'
export * from '@element-ai-vue/constants'
export * from '@element-ai-vue/directives'
export * from '@element-ai-vue/hooks'

export const install = installer.install
export const version = installer.version
export default installer

export { default as dayjs } from 'dayjs'
