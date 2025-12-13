import { defineConfig } from 'vitepress'
import { enSidebar, zhSidebar } from './sidebar'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'
import { demoblockPlugin, demoblockVitePlugin } from 'vitepress-theme-demoblock'
import { enNav, zhNav } from './nav'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'element-ai',

  description: '企业级 AI 交互组件库',
  markdown: {
    config(md) {
      md.use(demoblockPlugin)
      md.use(groupIconMdPlugin)
    },
  },
  vite: {
    plugins: [groupIconVitePlugin(), demoblockVitePlugin()],
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: { src: '/logo.svg', width: 30, height: 30 },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/1365436742/element-ai' },
    ],
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo-black.svg' }],
  ],
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
      },
    },
  },
})
