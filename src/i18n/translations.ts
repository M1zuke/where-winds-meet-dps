import english from "./locales/en.json"
import korean from "./locales/ko.json"
import chinese from "./locales/zh.json"

export type Locale = "en" | "ko" | "zh"

export const LOCALES: readonly Locale[] = ["en", "ko", "zh"]

export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  en: "English",
  ko: "한국어",
  zh: "中文",
}

const DICTIONARIES: Record<Locale, Record<string, string>> = {
  en: english,
  ko: korean,
  zh: chinese,
}

export function isLocale(value: string | null): value is Locale {
  return LOCALES.includes(value as Locale)
}

export function translate(key: string, locale: Locale, fallback?: string): string {
  return DICTIONARIES[locale]?.[key] || DICTIONARIES.en[key] || fallback || key
}
