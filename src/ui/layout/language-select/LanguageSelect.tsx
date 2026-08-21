import { useI18n } from "../../../i18n/i18nContext"
import { LOCALES, LOCALE_LABELS, type Locale } from "../../../i18n/translations"
import { Select } from "../../components/select/Select"
import styles from "./LanguageSelect.module.scss"

export function LanguageSelect() {
  const { locale, setLocale, t } = useI18n()
  return (
    <span className={styles.languageSelect}>
      <Select<Locale>
        compact
        ariaLabel={t("layout.languageSelect.language")}
        value={locale}
        options={LOCALES.map((option) => ({ value: option, label: LOCALE_LABELS[option] }))}
        onChange={setLocale}
      />
    </span>
  )
}
