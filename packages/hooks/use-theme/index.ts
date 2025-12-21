import { inject, InjectionKey, isRef, Ref, ref } from 'vue'
export type ThemeType = 'light' | 'dark'

export const themeContextKey: InjectionKey<Ref<ThemeType | undefined>> =
  Symbol('themeContextKey')

export const useTheme = (propsTheme?: Ref<ThemeType | undefined>) => {
  const theme = inject(themeContextKey, propsTheme)!
  return {
    theme: isRef(theme) ? theme : ref(theme),
  }
}
