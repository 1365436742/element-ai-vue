import type { InjectionKey, Slot } from 'vue'

export const strings = {
  ZERO_WIDTH_CHAR: '\uFEFF',
}

export const SELECT_SLOT_CONTENT_INJECTION_KEY: InjectionKey<Slot | undefined> =
  Symbol('selectSlotContent')
