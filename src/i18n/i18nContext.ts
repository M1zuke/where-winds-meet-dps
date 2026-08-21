import { createContext, useContext } from "react"
import type { Locale } from "./translations"

export interface I18nValue {
  locale: Locale
  setLocale(locale: Locale): void
  t(text: string): string
}

export const I18nContext = createContext<I18nValue>({
  locale: "en",
  setLocale: () => {},
  t: (text) => text,
})

export function useI18n(): I18nValue {
  return useContext(I18nContext)
}
