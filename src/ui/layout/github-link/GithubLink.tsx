import { useI18n } from "../../../i18n/i18nContext"
import { GithubIcon } from "../../components/github-icon/GithubIcon"
import styles from "./GithubLink.module.scss"

export const GITHUB_REPO_URL = "https://github.com/M1zuke/where-winds-meet-dps"

export function GithubLink() {
  const { t } = useI18n()
  return (
    <span className={styles.contributeNote}>
      {t("Want to contribute? Click here →")}
      <a
        className={styles.githubLink}
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("Contribute on GitHub")}
        title={t("Open the GitHub repository")}
      >
        <GithubIcon />
      </a>
    </span>
  )
}
