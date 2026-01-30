import { defineConfig } from 'vitepress'
import { enSidebar, zhSidebar } from './sidebar'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'
import { demoblockPlugin, demoblockVitePlugin } from 'vitepress-theme-demoblock'
import path from 'path'
import { enNav, zhNav } from './nav'
import { enSearch, zhSearch } from './search'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'element-ai-vue',

  description: '企业级 AI 交互组件库',
  lastUpdated: true,
  cleanUrls: true,
  sitemap: {
    hostname: 'https://element-ai-vue.com',
  },
  markdown: {
    config(md) {
      md.use(demoblockPlugin)
      md.use(groupIconMdPlugin)
    },
  },
  vite: {
    plugins: [groupIconVitePlugin(), demoblockVitePlugin()],
    resolve: {
      alias: {
        '@element-ai-vue/components': path.resolve(
          __dirname,
          '../../../packages/components'
        ),
        '@element-ai-vue/utils': path.resolve(
          __dirname,
          '../../../packages/utils'
        ),
        '@element-ai-vue/hooks': path.resolve(
          __dirname,
          '../../../packages/hooks'
        ),
        '@element-ai-vue/directives': path.resolve(
          __dirname,
          '../../../packages/directives'
        ),
        '@element-ai-vue/constants': path.resolve(
          __dirname,
          '../../../packages/constants'
        ),
        '@element-ai-vue/locale': path.resolve(
          __dirname,
          '../../../packages/locale'
        ),
        '@element-ai-vue/theme-chalk': path.resolve(
          __dirname,
          '../../../packages/theme-chalk'
        ),
        'element-ai-vue': path.resolve(
          __dirname,
          '../../../packages/element-ai-vue'
        ),
      },
    },
    server: {
      host: '0.0.0.0',
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: 'local',
      options: {
        locales: {
          root: zhSearch,
          en: enSearch,
        },
      },
    },
    logo: { src: '/logo.svg', width: 30, height: 30 },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/1365436742/element-ai-vue' },
      {
        icon: 'npm',
        link: 'https://www.npmjs.com/package/element-ai-vue',
      },
    ],
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo-black.svg' }],
    ['meta', { name: 'author', content: 'Element Ai Vue Team' }],
    [
      'meta',
      {
        name: 'keywords',
        content:
          'element-ai-vue, vue3, ai components, ui library, element-plus, chat ui',
      },
    ],
    ['meta', { property: 'og:title', content: 'Element Ai Vue' }],
    ['meta', { property: 'og:description', content: '企业级 AI 交互组件库' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
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
