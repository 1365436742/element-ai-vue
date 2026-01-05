<template>
  <div :class="[ns.b(), theme === 'dark' ? ns.m('dark') : '']">
    <slot
      name="header"
      :content="content"
      :language="language"
      :isCopied="isCopied"
      :onCopy="onCopy"
      :toggleExpanded="toggleExpanded"
    >
      <div :class="ns.e('header')">
        <div
          @click="toggleExpanded"
          :class="[ns.e('select'), ns.is('expanded', computedExpanded)]"
        >
          <span class="element-ai-vue-iconfont icon-expanded"></span>
        </div>
        <div :class="ns.e('language')" @click="toggleExpanded">
          {{ language }}
        </div>
      </div>
      <div :class="ns.e('action')">
        <Tooltip :content="t('el.codeHighlight.copy', '复制代码')">
          <div :class="ns.e('icon')" @click="onCopy">
            <span
              :class="[
                'element-ai-vue-iconfont',
                isCopied ? 'icon-correct' : 'icon-copy',
              ]"
            ></span>
          </div>
        </Tooltip>
      </div>
    </slot>
    <TransitionHeight :show="computedExpanded">
      <div :class="ns.e('content')" v-html="htmlContent"></div>
    </TransitionHeight>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElACodeHighlight',
})
import { CodeHighlightThemeMap, commonLangs } from '@element-ai-vue/constants'
import {
  useCopy,
  useLocale,
  useNamespace,
  useTheme,
} from '@element-ai-vue/hooks'
import { getHighlighter, HighlighterType } from '@element-ai-vue/utils'
import { computed, onMounted, PropType, ref, watch } from 'vue'
import Tooltip from '../tooltip/index.vue'
import { CodeHighlightEmitsType, codeHighlightProps } from './props'
import TransitionHeight from '../transition-height/index.vue'

const { t } = useLocale()
const ns = useNamespace('code-highlight')
const curExpanded = ref(true)
const computedExpanded = computed(() => props.expanded ?? curExpanded.value)
const emits = defineEmits<CodeHighlightEmitsType>()
const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: '',
  },
  theme: {
    type: String as PropType<'light' | 'dark'>,
    default: undefined,
  },
  ...codeHighlightProps,
})
const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)

const htmlContent = ref('')
const highlighter = ref<HighlighterType | null>(null)
const { isCopied, onCopy: copyContent } = useCopy()

const onCopy = () => {
  copyContent(props.content)
}

const toggleExpanded = () => {
  curExpanded.value = !curExpanded.value
  emits('update:expanded', curExpanded.value)
}

onMounted(async () => {
  highlighter.value = await getHighlighter({
    langs: props.extendLanguages || [],
    themes: props.extendThemes || [],
  })
})

defineExpose({
  onCopy,
  toggleExpanded,
})

watch(
  [() => props.content, () => highlighter.value, () => theme.value],
  async () => {
    if (!highlighter.value || !theme.value) return
    const hasLang = commonLangs.includes(props.language || '')
    const html = await highlighter.value.codeToHtml(props.content, {
      lang: hasLang ? props.language : 'plaintext',
      theme:
        CodeHighlightThemeMap[theme.value || 'light'] ||
        theme.value ||
        'github-light',
    })
    htmlContent.value = html
  },
  { immediate: true }
)
</script>
