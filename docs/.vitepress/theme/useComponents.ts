// Don't remove this file, because it registers the demo components.
import Demo from 'vitepress-theme-demoblock/dist/client/components/Demo.vue'
import DemoBlock from 'vitepress-theme-demoblock/dist/client/components/DemoBlock.vue'
import { App } from 'vue'

export function useComponents(app: App<any>) {
  app.component('Demo', Demo)
  app.component('DemoBlock', DemoBlock)

  /**
   * 自动找examples里面的文件注册，注册名字规则如下：
   * 1. 组件内有name属性，则以name属性为准
   * 2. 组件内无name属性，则以文件路径为准，去掉examples/前缀和.vue后缀，转为大驼峰命名法
   *    例如：examples/code-highlight/base.vue => CodeHighlightBase
   */
  // @ts-ignore
  const modules = import.meta.glob('../../examples/**/*.vue', { eager: true })
  for (const path in modules) {
    const component = (modules[path] as any).default
    if (!component) continue
    let name = component.name
    if (!name) {
      const segments = path.split('/')
      const index = segments.indexOf('examples')
      if (index !== -1) {
        name = segments
          .slice(index + 1)
          .map((part) => part.replace(/\.vue$/, ''))
          .map((part) =>
            part
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join('')
          )
          .join('')
      } else {
        name = path
          .split('/')
          .pop()
          ?.replace(/\.vue$/, '')
      }
    }
    if (name) {
      app.component(name, component)
    }
  }
}
