import { computed, inject, isRef, ref, unref } from 'vue'
import { get } from 'lodash-unified'
import ZH_CN from '@element-ai-vue/locale/lang/zh-cn'

import type { MaybeRef } from '@vueuse/core'
import type { InjectionKey, Ref } from 'vue'
import type { FieldPath } from '@element-ai-vue/utils'
import type { Language } from '@element-ai-vue/locale'

export type LocaleKeys =
  | Exclude<FieldPath<typeof ZH_CN>, 'name' | 'el'>
  | (string & NonNullable<unknown>)

export type TranslatorOption = Record<string, string | number>
export type Translator = (
  path: LocaleKeys,
  defaultStr: string,
  option?: TranslatorOption
) => string
export type LocaleContext = {
  locale: Ref<Language>
  lang: Ref<string>
  t: Translator
}

export const buildTranslator =
  (locale: MaybeRef<Language>): Translator =>
  (path, defaultStr, option) =>
    translate(path, defaultStr, option, unref(locale))

export const translate = (
  path: LocaleKeys,
  defaultStr: string,
  option: undefined | TranslatorOption,
  locale: Language
): string =>
  (get(locale, path, defaultStr ?? path) as string).replace(
    /\{(\w+)\}/g,
    (_, key) => `${option?.[key] ?? `{${key}}`}`
  )

export const buildLocaleContext = (
  locale: MaybeRef<Language>
): LocaleContext => {
  const lang = computed(() => unref(locale).name)
  const localeRef = isRef(locale) ? locale : ref(locale)
  return {
    lang,
    locale: localeRef,
    t: buildTranslator(locale),
  }
}

export const localeContextKey: InjectionKey<Ref<Language | undefined>> =
  Symbol('localeContextKey')

export const useLocale = (localeOverrides?: Ref<Language | undefined>) => {
  const locale = localeOverrides || inject(localeContextKey, ref())!
  return buildLocaleContext(computed(() => locale.value || ZH_CN))
}
