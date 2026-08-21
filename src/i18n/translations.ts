import korean from "./locales/ko.json"

export type Locale = "en" | "ko"

export const LOCALES: readonly Locale[] = ["en", "ko"]

export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  en: "English",
  ko: "한국어",
}

const DICTIONARIES: Record<Locale, Record<string, string>> = {
  en: {},
  ko: korean,
}

export function isLocale(value: string | null): value is Locale {
  return LOCALES.includes(value as Locale)
}

export function translate(text: string, locale: Locale): string {
  return DICTIONARIES[locale]?.[text] || text
}
