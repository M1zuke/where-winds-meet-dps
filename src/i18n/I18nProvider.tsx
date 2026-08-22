import { useEffect, useState, type ReactNode } from "react"
import { isLocale, translate, type Locale } from "./translations"
import { kvStore } from "../kvStore"
import { I18nContext, type I18nValue } from "./i18nContext"

const STORAGE_KEY = "wwm.locale"

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = kvStore.get(STORAGE_KEY)
    return isLocale(saved) ? saved : "en"
  })
  useEffect(() => {
    kvStore.set(STORAGE_KEY, locale)
  }, [locale])
  const value: I18nValue = {
    locale,
    setLocale: setLocaleState,
    t: (key, fallback) => translate(key, locale, fallback),
  }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
