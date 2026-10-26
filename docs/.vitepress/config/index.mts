import { defineConfig, type HeadConfig } from 'vitepress'
import { enSidebar, zhSidebar } from './sidebar'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'
import { demoblockPlugin, demoblockVitePlugin } from 'vitepress-theme-demoblock'
import path from 'path'
import { enNav, zhNav } from './nav'
import { enSearch, zhSearch } from './search'
import '../../../internal/vue-types/compiler'

const hostname = 'https://element-ai-vue.com'
const descriptions = {
  zh: 'Element AI Vue（element-ai-vue）是基于 Vue 3 的开源 AI 聊天组件库，提供消息气泡、输入框、流式 Markdown、思考状态和文件上传组件，帮助构建 AI 智能助手与大模型对话界面。',
  en: 'Element AI Vue (element-ai-vue) is an open-source Vue 3 AI chat UI library with message bubbles, prompt inputs, streaming Markdown, thinking states, and file uploads for chatbot applications.',
}
const pageUrl = (file: string) =>
  `${hostname}/${file.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')}`

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'element-ai-vue',

  description: descriptions.zh,
  lastUpdated: true,
  cleanUrls: true,
  sitemap: {
    hostname,
    transformItems(items) {
      // The root page redirects to /zh/; only list canonical documentation URLs.
      const pages = items.filter((item) => /^(zh|en)\//.test(item.url))
      const urls = new Set(pages.map((item) => item.url))
      return pages.map((item) => {
        const suffix = item.url.replace(/^(zh|en)\//, '')
        return {
          ...item,
          links: [
            { lang: 'zh-CN', url: `zh/${suffix}` },
            { lang: 'en', url: `en/${suffix}` },
          ].filter((link) => urls.has(link.url)),
        }
      })
    },
  },
  transformHead({ pageData }) {
    // VitePress generates its default 404 without running transformPageData.
    if (pageData.isNotFound) {
      return [['meta', { name: 'robots', content: 'noindex, follow' }]]
    }
  },
  transformPageData(pageData, { siteConfig }) {
    if (pageData.relativePath === '404.md') {
      pageData.frontmatter.head = [
        ...(pageData.frontmatter.head || []),
        ['meta', { name: 'robots', content: 'noindex, follow' }],
      ]
      return
    }

    const file = pageData.relativePath
    const isEnglish = file.startsWith('en/')
    const isHome = /(^|\/)index\.md$/.test(file)
    if (!pageData.description) {
      pageData.description = isHome
        ? descriptions[isEnglish ? 'en' : 'zh']
        : isEnglish
          ? `${pageData.title} documentation for Element AI Vue, the Vue 3 AI chat UI library. Learn usage and integration with examples.`
          : `Element AI Vue 的${pageData.title}文档，介绍 Vue 3 AI 聊天组件库的使用与集成方法，并提供示例。`
    }

    const canonical = pageUrl(file === 'index.md' ? 'zh/index.md' : file)
    const title = `${pageData.title} | element-ai-vue`
    const head: HeadConfig[] = [
      ['link', { rel: 'canonical', href: canonical }],
      ['meta', { property: 'og:url', content: canonical }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: pageData.description }],
      [
        'meta',
        { property: 'og:locale', content: isEnglish ? 'en_US' : 'zh_CN' },
      ],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: pageData.description }],
    ]
    const suffix = file.replace(/^(zh|en)\//, '')
    for (const [locale, lang] of [
      ['zh', 'zh-CN'],
      ['en', 'en'],
    ]) {
      const alternate = `${locale}/${suffix}`
      if (siteConfig.pages.includes(alternate)) {
        head.push([
          'link',
          { rel: 'alternate', hreflang: lang, href: pageUrl(alternate) },
        ])
      }
    }
    pageData.frontmatter.head = [...(pageData.frontmatter.head || []), ...head]
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
          '../../../packages/element-ai-vue/index.ts'
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
      {
        icon: {
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="64" /><rect x="110" y="310" width="60" height="60" fill="#fafafa"/><text x="320" y="370" font-family="'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace" font-size="420" font-weight="500" text-anchor="middle" fill="#fafafa" ><tspan>/</tspan></text></svg>`,
        },
        link: 'https://npmx.dev/package/element-ai-vue',
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
          'element-ai-vue, element ai vue, element, vue3, ai components, ui library, element-plus, chat ui, ai search, llm, agent, prompt, chatbot, 大模型前端组件库',
      },
    ],
    [
      'meta',
      {
        name: 'robots',
        content:
          'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://element-ai-vue.com/og-image.png',
      },
    ],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:site_name', content: 'Element Ai Vue' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    [
      'meta',
      {
        name: 'twitter:image',
        content: 'https://element-ai-vue.com/og-image.png',
      },
    ],
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
      description: descriptions.en,
      link: '/en/',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
      },
    },
  },
})
