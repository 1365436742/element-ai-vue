import { Language } from '@element-ai-vue/locale'
import { ExtractPublicPropTypes, PropType } from 'vue'

export const configProviderProps = {
  /**
   * @description Locale Object
   */
  locale: {
    type: Object as PropType<Language>,
  },
  theme: {
    type: String as PropType<'light' | 'dark'>,
  },
}

export type ConfigProviderProps = Partial<
  ExtractPublicPropTypes<typeof configProviderProps>
>
