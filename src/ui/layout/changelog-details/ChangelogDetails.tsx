import { useI18n } from "../../../i18n/i18nContext"
import type {
  ChangelogEntry,
  ChangelogEntryDetails,
  ChangelogSectionLabel,
} from "../../../changelog/types"
import styles from "./ChangelogDetails.module.scss"

const SECTION_TONE: Record<ChangelogSectionLabel, string> = {
  Added: styles.toneAdded,
  Changed: styles.toneChanged,
  Fixed: styles.toneFixed,
}

export function ChangelogDetails({
  entry,
  details,
  isLoading,
  hasFailed,
}: {
  entry: ChangelogEntry
  details: ChangelogEntryDetails | null
  isLoading: boolean
  hasFailed: boolean
}) {
  const { t } = useI18n()

  return (
    <div className={styles.details}>
      <div className={styles.heading}>
        <span className={styles.version}>{`v${entry.version}`}</span>
        <span className={styles.date}>{entry.date}</span>
      </div>
      <h3 className={styles.headline}>{entry.headline}</h3>
      {isLoading && <p className={styles.status}>{t("Loading…")}</p>}
      {hasFailed && <p className={styles.status}>{t("Failed to load this entry.")}</p>}
      {details?.sections.map((section) => (
        <section key={section.label} className={`${styles.section} ${SECTION_TONE[section.label]}`}>
          <div className={styles.sectionLabel}>{section.label}</div>
          <ul className={styles.changes}>
            {section.items.map((item) => (
              <li key={item.text} className={styles.change}>
                <span className={styles.changeText}>{item.text}</span>
                {item.authors.length > 0 && (
                  <span className={styles.credit}>
                    <span className={styles.creditLabel}>{t("done by")}</span>
                    {item.authors.map((author) => (
                      <a
                        key={author}
                        className={styles.authorLink}
                        href={`https://github.com/${author}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={author}
                        aria-label={author}
                      >
                        <img
                          src={`https://github.com/${author}.png?size=40`}
                          alt=""
                          width={18}
                          height={18}
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
