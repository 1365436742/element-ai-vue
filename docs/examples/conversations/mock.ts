import { ConversationItem } from 'element-ai-vue'
import { v4 as uuidv4 } from 'uuid'

export const mockList = [
  {
    key: '-1',
    label: '如何快速上手 Vue3 组合式 API？',
  },
  {
    key: '1',
    label: '如何快速上手 Vue3 组合式组合式组合式 API？',
    group: '今天',
  },
  {
    key: '2',
    label: 'TypeScript 泛型有哪些使用技巧？',
    group: '今天',
  },
  {
    key: '3',
    label: '帮我写一个防抖函数',
    group: '今天',
  },
  {
    key: '4',
    label: 'Pinia 和 Vuex 有什么区别？',
    group: '昨天',
  },
  {
    key: '5',
    label: '如何用 CSS Grid 实现响应式布局？',
    group: '昨天',
  },
  {
    key: '6',
    label: 'React Hooks 原理是什么？',
    group: '昨天',
  },
  {
    key: '7',
    label: '解释一下 Event Loop 事件循环机制',
    group: '7 天内',
  },
  {
    key: '8',
    label: 'Webpack 和 Vite 打包工具对比',
    group: '7 天内',
  },
  {
    key: '9',
    label: '如何优化前端首屏加载速度？',
    group: '7 天内',
  },
  {
    key: '10',
    label: 'Node.js 异步编程最佳实践',
    group: '7 天内',
  },
  {
    key: '11',
    label: '写一个深拷贝函数',
    group: '更早',
  },
  {
    key: '12',
    label: 'HTTP 缓存策略详解',
    group: '更早',
  },
  {
    key: '13',
    label: '浏览器渲染流程是怎样的？',
    group: '更早',
  },
  {
    key: '14',
    label: 'React 和 Vue 框架对比分析',
    group: '更早',
  },
]

export const fetchList = () => {
  return new Promise<ConversationItem[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          key: uuidv4(),
          label: '新加载出来的' + uuidv4().slice(0, 2),
          group: '更早',
        },
        {
          key: uuidv4(),
          label: '新加载出来的' + uuidv4().slice(0, 2),
          group: '更早',
        },
        {
          key: uuidv4(),
          label: '新加载出来的' + uuidv4().slice(0, 2),
          group: '更早',
        },
      ])
    }, 2000)
  })
}
