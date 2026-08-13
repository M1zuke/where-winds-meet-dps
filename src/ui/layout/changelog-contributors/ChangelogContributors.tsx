import { useEffect, useState } from "react"
import { useI18n } from "../../../i18n/i18nContext"
import { loadContributors, type Contributor } from "./contributors"
import styles from "./ChangelogContributors.module.scss"

export function ChangelogContributors() {
  const { t } = useI18n()
  const [contributors, setContributors] = useState<Contributor[]>([])

  useEffect(() => {
    let isCurrent = true
    loadContributors()
      .then((loaded) => {
        if (isCurrent) setContributors(loaded)
      })
      .catch(() => {})
    return () => {
      isCurrent = false
    }
  }, [])

  if (contributors.length === 0) return null

  return (
    <div className={styles.contributors}>
      <div className={styles.label}>{t("Contributors")}</div>
      <ul className={styles.avatars}>
        {contributors.map((contributor) => (
          <li key={contributor.login}>
            <a
              className={styles.profileLink}
              href={contributor.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={contributor.login}
              aria-label={contributor.login}
            >
              <img src={contributor.avatarUrl} alt="" width={28} height={28} loading="lazy" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
