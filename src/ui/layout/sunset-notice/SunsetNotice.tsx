import { useI18n } from "../../../i18n/i18nContext"
import styles from "./SunsetNotice.module.scss"

export const SUCCESSOR_CALCULATOR_URL = "https://greydust.github.io/where-builds-meet/"

export function SunsetNotice() {
  const { t } = useI18n()
  return (
    <main className={styles.page}>
      <section className={styles.box} aria-labelledby="sunset-notice-title">
        <h1 id="sunset-notice-title" className={styles.title}>
          {t("layout.sunsetNotice.title")}
        </h1>
        <p className={styles.text}>{t("layout.sunsetNotice.discontinued")}</p>
        <p className={styles.text}>{t("layout.sunsetNotice.reason")}</p>
        <p className={styles.text}>{t("layout.sunsetNotice.useInstead")}</p>
        <a className={styles.successorButton} href={SUCCESSOR_CALCULATOR_URL}>
          <span>{t("layout.sunsetNotice.useGreydustCalculator")}</span>
          <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </section>
    </main>
  )
}
