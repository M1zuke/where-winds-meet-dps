import { lazy, Suspense, useState } from "react"
import { useI18n } from "../../../i18n/i18nContext"
import { APP_VERSION } from "../../../appVersion"
import { isNewerVersion, loadLastSeenVersion, saveLastSeenVersion } from "./lastSeenVersion"
import styles from "./ChangelogButton.module.scss"

const ChangelogDialog = lazy(() =>
  import("../changelog-dialog/ChangelogDialog").then((module) => ({
    default: module.ChangelogDialog,
  })),
)

export function ChangelogButton() {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnseenVersion, setHasUnseenVersion] = useState(() =>
    isNewerVersion(APP_VERSION, loadLastSeenVersion()),
  )

  function handleClick() {
    setIsOpen(true)
    setHasUnseenVersion(false)
    saveLastSeenVersion(APP_VERSION)
  }

  return (
    <>
      <button
        type="button"
        className={styles.versionControl}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={t("View the changelog")}
        onClick={handleClick}
      >
        {`v${APP_VERSION}`}
        {hasUnseenVersion && <span className={styles.marker}>{t("New")}</span>}
      </button>
      {isOpen && (
        <Suspense
          fallback={
            <div className={styles.loadingOverlay}>
              <span>{t("Loading…")}</span>
            </div>
          }
        >
          <ChangelogDialog onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
