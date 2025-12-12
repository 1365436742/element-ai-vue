import installer from './defaults'

export * from '@element-ai/components'
export * from '@element-ai/constants'
export * from '@element-ai/directives'
export * from '@element-ai/hooks'

export const install = installer.install
export const version = installer.version
export default installer

export { default as dayjs } from 'dayjs'
