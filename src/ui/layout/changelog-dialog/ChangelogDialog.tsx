import { useEffect, useId, useRef, useState } from "react"
import { useI18n } from "../../../i18n/i18nContext"
import { CHANGELOG_ENTRIES } from "../../../changelog/registry"
import type { ChangelogEntryDetails } from "../../../changelog/types"
import { Dialog, DialogFooter, DialogHeader } from "../../components/dialog/Dialog"
import { ChangelogDetails } from "../changelog-details/ChangelogDetails"
import { ChangelogContributors } from "../changelog-contributors/ChangelogContributors"
import styles from "./ChangelogDialog.module.scss"

export function ChangelogDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const titleId = useId()
  const panelId = useId()
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const pendingLoadsRef = useRef(new Map<string, Promise<ChangelogEntryDetails>>())
  const [selectedVersion, setSelectedVersion] = useState(CHANGELOG_ENTRIES[0]?.version ?? "")
  const [detailsByVersion, setDetailsByVersion] = useState<Record<string, ChangelogEntryDetails>>(
    {},
  )
  const [failedVersions, setFailedVersions] = useState<string[]>([])

  const selectedEntry = CHANGELOG_ENTRIES.find((entry) => entry.version === selectedVersion) ?? null
  const details = detailsByVersion[selectedVersion] ?? null
  const hasFailed = failedVersions.includes(selectedVersion)

  useEffect(() => {
    if (detailsByVersion[selectedVersion] || failedVersions.includes(selectedVersion)) return
    const entry = CHANGELOG_ENTRIES.find((candidate) => candidate.version === selectedVersion)
    if (!entry) return

    const pending = pendingLoadsRef.current.get(selectedVersion) ?? entry.loadDetails()
    pendingLoadsRef.current.set(selectedVersion, pending)

    let isCurrent = true
    pending
      .then((loaded) => {
        if (isCurrent) setDetailsByVersion((current) => ({ ...current, [selectedVersion]: loaded }))
      })
      .catch(() => {
        if (isCurrent) setFailedVersions((current) => [...current, selectedVersion])
      })
    return () => {
      isCurrent = false
    }
  }, [selectedVersion, detailsByVersion, failedVersions])

  return (
    <Dialog
      labelledBy={titleId}
      onClose={onClose}
      surfaceClassName={styles.surface}
      initialFocusRef={closeButtonRef}
    >
      <DialogHeader>
        <h2 id={titleId}>{t("Changelog")}</h2>
      </DialogHeader>
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <ul className={styles.versionList}>
            {CHANGELOG_ENTRIES.map((entry) => (
              <li key={entry.version}>
                <button
                  type="button"
                  className={
                    entry.version === selectedVersion
                      ? `${styles.versionButton} ${styles.versionButtonSelected}`
                      : styles.versionButton
                  }
                  aria-current={entry.version === selectedVersion}
                  aria-controls={panelId}
                  onClick={() => setSelectedVersion(entry.version)}
                >
                  <span className={styles.versionNumber}>{`v${entry.version}`}</span>
                  <span className={styles.versionDate}>{entry.date}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.contributorsArea}>
            <ChangelogContributors />
          </div>
        </div>
        <div className={styles.panel} id={panelId}>
          {selectedEntry && (
            <ChangelogDetails
              entry={selectedEntry}
              details={details}
              isLoading={!details && !hasFailed}
              hasFailed={hasFailed}
            />
          )}
        </div>
      </div>
      <DialogFooter>
        <button type="button" ref={closeButtonRef} className="btn" onClick={onClose}>
          {t("Close")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
