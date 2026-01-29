// oxlint-disable no-unused-vars
// oxlint-disable no-console
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// 根目录
const ROOT_DIR = path.resolve(__dirname, '..')
const COMPONENTS_DIR = path.join(ROOT_DIR, 'packages/components')
const THEME_DIR = path.join(ROOT_DIR, 'packages/theme-chalk/src')
const DOCS_DIR = path.join(ROOT_DIR, 'docs')
const SIDEBAR_FILE = path.join(ROOT_DIR, 'docs/.vitepress/config/sidebar.ts')
const COMPONENT_TS_FILE = path.join(
  ROOT_DIR,
  'packages/element-ai-vue/component.ts'
)
const GLOBAL_DTS_FILE = path.join(ROOT_DIR, 'typings/global.d.ts')

// 组件类型配置 (从 sidebar.ts 的 zhSidebar 提取)
interface CategoryItem {
  text: string
  enText: string
  parent?: string
}

// 解析 sidebar 获取分类名列表
function parseSidebarCategories(sidebarContent: string): string[] {
  const categories: string[] = []
  const lines = sidebarContent.split('\n')
  let depth = 0

  for (const line of lines) {
    depth += (line.match(/{/g) || []).length
    depth -= (line.match(/}/g) || []).length

    const textMatch = line.match(/text:\s*['"]([^'"]+)['"]/)
    const linkMatch = line.match(/link:\s*['"]([^'"]+)['"]/)

    if (textMatch && !linkMatch) {
      const text = textMatch[1]
      if (text) {
        categories.push(text)
      }
    }
  }
  return categories
}

// 解析 sidebar.ts 获取组件分类
function getComponentCategories(): CategoryItem[] {
  const content = fs.readFileSync(SIDEBAR_FILE, 'utf-8')
  const categories: CategoryItem[] = []

  // 匹配 zhSidebar 部分
  const zhSidebarMatch = content.match(
    /export const zhSidebar[\s\S]*?=\s*\[([\s\S]*?)\]\s*export/
  )
  // 匹配 enSidebar 部分
  const enSidebarMatch = content.match(
    /export const enSidebar[\s\S]*?=\s*\[([\s\S]*?)\]\s*$/
  )

  if (!zhSidebarMatch || !enSidebarMatch) {
    console.error('无法解析 sidebar.ts')
    return categories
  }

  const zhCategories = parseSidebarCategories(zhSidebarMatch[1])
  const enCategories = parseSidebarCategories(enSidebarMatch[1])

  // 通过索引对应中英文分类
  for (let i = 0; i < zhCategories.length; i++) {
    categories.push({
      text: zhCategories[i],
      enText: enCategories[i] || zhCategories[i],
    })
  }

  return categories.filter((c) => c.text !== '')
}

// 转换组件名为不同格式
function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

function toCamelCase(name: string): string {
  const pascal = toPascalCase(name)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

// 创建 readline 接口
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

// 询问用户输入
function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

// 选择菜单
async function select(
  rl: readline.Interface,
  question: string,
  options: string[]
): Promise<number> {
  console.log(`\n${question}`)
  options.forEach((opt, index) => {
    console.log(`  ${index + 1}. ${opt}`)
  })

  while (true) {
    const answer = await ask(rl, `请输入选项 (1-${options.length}): `)
    const num = parseInt(answer, 10)
    if (num >= 1 && num <= options.length) {
      return num - 1
    }
    console.log('无效的选项，请重新输入')
  }
}

// 生成组件文件
function generateComponentFiles(
  componentName: string,
  category: string,
  enCategory: string
): void {
  const kebabName = toKebabCase(componentName)
  const pascalName = toPascalCase(componentName)
  const camelName = toCamelCase(componentName)

  const componentDir = path.join(COMPONENTS_DIR, kebabName)
  const themeDir = path.join(THEME_DIR, kebabName)
  const examplesDir = path.join(DOCS_DIR, 'examples', kebabName)
  const zhDocsDir = path.join(DOCS_DIR, 'zh/base')
  const enDocsDir = path.join(DOCS_DIR, 'en/base')

  // 1. 创建组件目录
  if (fs.existsSync(componentDir)) {
    console.error(`❌ 组件目录已存在: ${componentDir}`)
    return
  }

  fs.mkdirSync(componentDir, { recursive: true })
  fs.mkdirSync(themeDir, { recursive: true })
  fs.mkdirSync(examplesDir, { recursive: true })

  // 2. 生成 packages/components/{name}/index.ts
  const indexTs = `import { withInstall } from '@element-ai-vue/utils'
import ${pascalName} from './index.vue'

export * from './props'
export const ElA${pascalName} = withInstall(${pascalName})
export default ElA${pascalName}
`
  fs.writeFileSync(path.join(componentDir, 'index.ts'), indexTs)

  // 3. 生成 packages/components/{name}/index.vue
  const indexVue = `<template>
  <div :class="ns.b()"></div>
</template>

<script setup lang="ts">
import { useNamespace, useTheme } from '@element-ai-vue/hooks'
import { ${camelName}Props } from './props'
import { computed } from 'vue'

defineOptions({
  name: 'ElA${pascalName}',
})

const props = defineProps({
  ...${camelName}Props,
})

const ns = useNamespace('${kebabName}')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
</script>
`
  fs.writeFileSync(path.join(componentDir, 'index.vue'), indexVue)

  // 4. 生成 packages/components/{name}/props.ts
  const propsTs = `import { ExtractPropTypes, PropType } from 'vue'

export const ${camelName}Props = {
  theme: {
    type: String as PropType<'dark' | 'light'>,
    default: undefined,
  },
}

export type ${pascalName}PropsType = PropType<
  Partial<ExtractPropTypes<typeof ${camelName}Props>>
>
`
  fs.writeFileSync(path.join(componentDir, 'props.ts'), propsTs)

  // 5. 生成样式文件 packages/theme-chalk/src/{name}/index.scss
  const indexScss = `@use '../mixins/config' as *;
@use '../mixins/mixins' as *;

@include b(${kebabName}) {
}
`
  fs.writeFileSync(path.join(themeDir, 'index.scss'), indexScss)

  // 6. 生成示例文件 docs/examples/{name}/base.vue
  const baseVue = `<template>
  <ElA${pascalName}></ElA${pascalName}>
</template>

<script setup lang="ts">
import { ElA${pascalName} } from 'element-ai-vue'
</script>
`
  fs.writeFileSync(path.join(examplesDir, 'base.vue'), baseVue)

  // 7. 生成中文文档 docs/zh/base/{name}.md
  const zhMd = `# ${pascalName} ${componentName}

## 基础用法

:::demo ${pascalName}Base

\`\`\`vue
<!-- @include: ../../examples/${kebabName}/base.vue -->
\`\`\`

:::
`
  fs.writeFileSync(path.join(zhDocsDir, `${kebabName}.md`), zhMd)

  // 8. 生成英文文档 docs/en/base/{name}.md
  const enMd = `# ${pascalName}

## Basic Usage

:::demo ${pascalName}Base

\`\`\`vue
<!-- @include: ../../examples/${kebabName}/base.vue -->
\`\`\`

:::
`
  fs.writeFileSync(path.join(enDocsDir, `${kebabName}.md`), enMd)

  // 9. 更新 packages/components/index.ts
  const componentsIndexPath = path.join(COMPONENTS_DIR, 'index.ts')
  let componentsIndex = fs.readFileSync(componentsIndexPath, 'utf-8')
  if (!componentsIndex.includes(`'./${kebabName}'`)) {
    componentsIndex += `export * from './${kebabName}'\n`
    fs.writeFileSync(componentsIndexPath, componentsIndex)
  }

  // 10. 更新 sidebar.ts
  updateSidebar(kebabName, pascalName, category, enCategory)

  // 11. 更新 packages/element-ai-vue/component.ts
  updateComponentTs(kebabName, pascalName)

  // 12. 更新 typings/global.d.ts
  updateGlobalDts(pascalName)

  console.log(`
✅ 组件 ${pascalName} 创建成功！

生成的文件:
  📁 packages/components/${kebabName}/
     ├── index.ts
     ├── index.vue
     └── props.ts
  📁 packages/theme-chalk/src/${kebabName}/
     └── index.scss
  📁 docs/examples/${kebabName}/
     └── base.vue
  📄 docs/zh/base/${kebabName}.md
  📄 docs/en/base/${kebabName}.md

已更新:
  📄 packages/components/index.ts
  📄 packages/element-ai-vue/component.ts
  📄 typings/global.d.ts
  📄 docs/.vitepress/config/sidebar.ts
`)
}

// 更新 sidebar.ts
function updateSidebar(
  kebabName: string,
  pascalName: string,
  category: string,
  enCategory: string
): void {
  let content = fs.readFileSync(SIDEBAR_FILE, 'utf-8')

  // 查找分类并添加新组件链接
  const zhPattern = new RegExp(
    `(text:\\s*['"]${category}['"][\\s\\S]*?items:\\s*\\[)([\\s\\S]*?)(\\]\\s*,?\\s*})`,
    'g'
  )

  const zhNewItem = `{ text: '${pascalName}', link: '/zh/base/${kebabName}' },`
  const enNewItem = `{ text: '${pascalName}', link: '/en/base/${kebabName}' },`

  // 更新中文 sidebar
  content = content.replace(zhPattern, (match, start, items, end) => {
    // 检查是否已存在
    if (items.includes(`'/zh/base/${kebabName}'`)) {
      return match
    }
    // 在 items 末尾添加新项
    const trimmedItems = items.trimEnd()
    const needsComma = trimmedItems.endsWith('}') && !trimmedItems.endsWith(',')
    const newItems = needsComma
      ? `${trimmedItems},\n      ${zhNewItem}\n    `
      : `${trimmedItems}\n      ${zhNewItem}\n    `
    return `${start}${newItems}${end}`
  })

  // 更新英文 sidebar
  const enPattern = new RegExp(
    `(text:\\s*['"]${enCategory}['"][\\s\\S]*?items:\\s*\\[)([\\s\\S]*?)(\\]\\s*,?\\s*})`,
    'g'
  )

  content = content.replace(enPattern, (match, start, items, end) => {
    if (items.includes(`'/en/base/${kebabName}'`)) {
      return match
    }
    const trimmedItems = items.trimEnd()
    const needsComma = trimmedItems.endsWith('}') && !trimmedItems.endsWith(',')
    const newItems = needsComma
      ? `${trimmedItems},\n      ${enNewItem}\n    `
      : `${trimmedItems}\n      ${enNewItem}\n    `
    return `${start}${newItems}${end}`
  })

  fs.writeFileSync(SIDEBAR_FILE, content)
}

// 更新 packages/element-ai-vue/component.ts
function updateComponentTs(kebabName: string, pascalName: string): void {
  let content = fs.readFileSync(COMPONENT_TS_FILE, 'utf-8')
  const componentName = `ElA${pascalName}`

  // 检查是否已存在
  if (content.includes(`import { ${componentName} }`)) {
    return
  }

  // 添加 import 语句
  const importLine = `import { ${componentName} } from '@element-ai-vue/components/${kebabName}'`
  const lastImportMatch = content.match(
    /import .* from '@element-ai-vue\/components\/[^']+'\n/
  )
  if (lastImportMatch) {
    const insertPos =
      content.lastIndexOf(lastImportMatch[0]) + lastImportMatch[0].length
    content =
      content.slice(0, insertPos) + importLine + '\n' + content.slice(insertPos)
  }

  // 添加到导出数组
  const exportArrayMatch = content.match(
    /export default \[([\s\S]*?)\] as Plugin\[\]/
  )
  if (exportArrayMatch) {
    const arrayContent = exportArrayMatch[1]
    const lastItem = arrayContent.trim().split(',').pop()?.trim()
    if (lastItem && !arrayContent.includes(componentName)) {
      const newArrayContent =
        arrayContent.trimEnd() + `,\n  ${componentName},\n`
      content = content.replace(exportArrayMatch[1], newArrayContent)
    }
  }

  fs.writeFileSync(COMPONENT_TS_FILE, content)
}

// 更新 typings/global.d.ts
function updateGlobalDts(pascalName: string): void {
  let content = fs.readFileSync(GLOBAL_DTS_FILE, 'utf-8')
  const componentName = `ElA${pascalName}`

  // 检查是否已存在
  if (content.includes(`${componentName}:`)) {
    return
  }

  // 在 GlobalComponents 接口中添加新组件
  const interfaceMatch = content.match(
    /(export interface GlobalComponents \{[\s\S]*?)(  \})/
  )
  if (interfaceMatch) {
    const newLine = `    ${componentName}: (typeof import('element-ai-vue'))['${componentName}']\n`
    content = content.replace(
      interfaceMatch[0],
      interfaceMatch[1] + newLine + interfaceMatch[2]
    )
  }

  fs.writeFileSync(GLOBAL_DTS_FILE, content)
}

// 主函数
async function main(): Promise<void> {
  console.log('🚀 Element AI Vue 组件生成器\n')

  const rl = createInterface()

  try {
    // 提示用户确认 git 状态
    console.log('⚠️  在添加新组件之前，请确保已提交当前的 git 更改。')
    const gitConfirm = await ask(rl, '是否已经提交 git? (y/n): ')
    if (gitConfirm.toLowerCase() !== 'y') {
      console.log('❌ 请先提交 git 更改后再运行此脚本')
      rl.close()
      return
    }

    // 第一步：输入组件名称
    const componentName = await ask(rl, '请输入组件名称 (格式: my-component): ')

    if (!componentName) {
      console.error('❌ 组件名称不能为空')
      rl.close()
      return
    }

    // 第二步：选择组件类型
    const categories = getComponentCategories()
    const categoryOptions = categories.map((c) => c.text)

    const categoryIndex = await select(rl, '请选择组件类型:', categoryOptions)
    const selectedCategory = categories[categoryIndex]

    console.log(`\n📦 组件名称: ${toPascalCase(componentName)}`)
    console.log(`📂 组件类型: ${selectedCategory.text}`)

    // 确认
    const confirm = await ask(rl, '\n确认创建组件? (y/n): ')
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ 已取消')
      rl.close()
      return
    }

    // 第三步：生成文件
    generateComponentFiles(
      componentName,
      selectedCategory.text,
      selectedCategory.enText
    )
  } finally {
    rl.close()
  }
}

main().catch(console.error)
