import { useState } from "react"
import { useI18n } from "../../../i18n/i18nContext"
import { kvStore } from "../../../kvStore"
import styles from "./QiBreakToast.module.scss"

export const QI_BREAK_TOAST_HIDDEN_UNTIL_KEY = "wwm.qiBreakToastHiddenUntil"
const HIDE_DURATION_MS = 7 * 24 * 60 * 60 * 1000

function readHiddenUntil(): number {
  const hiddenUntil = Number(kvStore.get(QI_BREAK_TOAST_HIDDEN_UNTIL_KEY))
  return Number.isFinite(hiddenUntil) ? hiddenUntil : 0
}

export function QiBreakToast({
  onCheckRotation,
  now = Date.now,
}: {
  onCheckRotation: () => void
  now?: () => number
}) {
  const { t } = useI18n()
  const [hiddenUntil, setHiddenUntil] = useState(readHiddenUntil)
  const [isClosed, setIsClosed] = useState(false)
  const [hideForWeek, setHideForWeek] = useState(false)
  const [checkRotationBefore = "", checkRotationAfter = ""] = t(
    "layout.outputPanel.qiBreakNoticeCheck",
  ).split("{link}")

  if (isClosed || now() < hiddenUntil) return null

  function close(): void {
    if (hideForWeek) {
      const until = now() + HIDE_DURATION_MS
      kvStore.set(QI_BREAK_TOAST_HIDDEN_UNTIL_KEY, String(until))
      setHiddenUntil(until)
    }
    setIsClosed(true)
  }

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        !
      </span>
      <div className={styles.body}>
        <strong className={styles.title}>{t("layout.outputPanel.qiBreakNoticeTitle")}</strong>
        <span className={styles.text}>
          {t("layout.outputPanel.qiBreakNoticeBody")} {checkRotationBefore}
          <span className={styles.linkGroup}>
            <button type="button" className={styles.link} onClick={onCheckRotation}>
              {t("layout.outputPanel.qiBreakNoticeCheckLink")}
            </button>
            {checkRotationAfter}
          </span>
        </span>
        <label className={styles.hideOption}>
          <input
            type="checkbox"
            checked={hideForWeek}
            onChange={(event) => setHideForWeek(event.target.checked)}
          />
          {t("layout.qiBreakToast.dontShowForSevenDays")}
        </label>
      </div>
      <button
        type="button"
        className={styles.closeButton}
        aria-label={t("layout.outputPanel.qiBreakNoticeDismiss")}
        title={t("layout.outputPanel.qiBreakNoticeDismiss")}
        onClick={close}
      >
        ×
      </button>
    </div>
  )
}
