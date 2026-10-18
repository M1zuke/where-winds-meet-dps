import { useState } from "react"
import type { Result } from "../../../engine/types"
import { useI18n } from "../../../i18n/i18nContext"
import { WarningLines } from "../output-panel/OutputPanel"
import styles from "./WarningsToast.module.scss"

function warningsSignature(result: Result): string {
  const qiEdgeWarnings = result.qiEdgeWarnings ?? []
  if (!result.warnings.length && !qiEdgeWarnings.length) return ""
  return JSON.stringify([result.warnings, qiEdgeWarnings])
}

export function WarningsToast({ result }: { result: Result }) {
  const { t } = useI18n()
  const [dismissedSignature, setDismissedSignature] = useState("")
  const signature = warningsSignature(result)

  if (signature === "" && dismissedSignature !== "") setDismissedSignature("")
  if (signature === "" || signature === dismissedSignature) return null

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <div className={styles.lines}>
        <WarningLines result={result} />
      </div>
      <button
        type="button"
        className={styles.closeButton}
        aria-label={t("common.close")}
        onClick={() => setDismissedSignature(signature)}
      >
        ×
      </button>
    </div>
  )
}
