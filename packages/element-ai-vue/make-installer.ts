import { INSTALLED_KEY } from '@element-ai-vue/constants'
import { version } from './version'

import type { App, Plugin } from 'vue'

export const makeInstaller = (components: Plugin[] = []) => {
  const install = (app: App) => {
    // @ts-ignore
    if (app[INSTALLED_KEY]) return
    // @ts-ignore
    app[INSTALLED_KEY] = true
    components.forEach((c) => app.use(c))
  }

  return {
    version,
    install,
  }
}
