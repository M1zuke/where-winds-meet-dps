import { useEffect, useState, type ReactNode } from "react"
import { isLocale, translate, type Locale } from "./translations"
import { kvStore } from "../kvStore"
import { I18nContext, useI18n, type I18nValue } from "./i18nContext"

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
    t: (text) => translate(text, locale),
  }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function T({ children }: { children: string }) {
  const { t } = useI18n()
  return <>{t(children)}</>
}
