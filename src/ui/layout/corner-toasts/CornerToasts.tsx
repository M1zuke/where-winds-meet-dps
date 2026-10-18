import type { Result } from "../../../engine/types"
import { QiBreakToast } from "../qi-break-toast/QiBreakToast"
import { WarningsToast } from "../warnings-toast/WarningsToast"
import styles from "./CornerToasts.module.scss"

export function CornerToasts({
  result,
  onCheckRotation,
  now,
}: {
  result: Result
  onCheckRotation: () => void
  now?: () => number
}) {
  return (
    <div className={styles.stack}>
      <QiBreakToast onCheckRotation={onCheckRotation} now={now} />
      <WarningsToast result={result} />
    </div>
  )
}
