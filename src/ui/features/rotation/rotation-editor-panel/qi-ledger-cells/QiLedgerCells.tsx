import { useI18n } from "../../../../../i18n/i18nContext"
import { formatQiDelta, type QiCastStatus, type QiLedgerCell } from "../../qiLedger"
import styles from "./QiLedgerCells.module.scss"

const RULER_TICKS = [0, 50, 100]

function fillClassName(fraction: number): string {
  if (fraction > 0.5) return styles.fillHigh
  if (fraction > 0.25) return styles.fillMid
  return styles.fillLow
}

export function QiLedgerHeaderCells({ max }: { max: number }) {
  const { t } = useI18n()
  return (
    <>
      <span className={`${styles.headCell} ${styles.alignEnd}`}>
        {t("rotation.editor.qiLedgerDelta")}
      </span>
      <span className={`${styles.headCell} ${styles.alignCenter}`}>0 → {Math.round(max)}</span>
      <span className={`${styles.headCell} ${styles.alignEnd}`}>
        {t("rotation.editor.remaining")}
      </span>
    </>
  )
}

export function QiLedgerCells({ cell, max }: { cell: QiLedgerCell | null; max: number }) {
  const { t } = useI18n()
  if (!cell) {
    return (
      <>
        <span />
        <span />
        <span />
      </>
    )
  }
  const fraction = max > 0 ? Math.max(0, Math.min(1, cell.remaining / max)) : 0
  const deltaClassName = [
    styles.delta,
    cell.status && Math.round(cell.deltaQi) === 0 ? styles.deltaHeld : "",
    cell.deltaQi > 0 ? styles.deltaGain : "",
  ]
    .filter(Boolean)
    .join(" ")
  const dotClassName = [
    styles.rulerDot,
    cell.status?.kind === "immune" ? styles.fillImmune : fillClassName(fraction),
  ].join(" ")
  return (
    <>
      <span className={deltaClassName} title={t("rotation.editor.qiLedgerDeltaHint")}>
        {formatQiDelta(cell.deltaQi)}
      </span>
      <span className={styles.ruler} aria-hidden="true">
        {RULER_TICKS.map((tick) => (
          <span key={tick} className={styles.rulerTick} style={{ left: `${tick}%` }} />
        ))}
        <span className={dotClassName} style={{ left: `${fraction * 100}%` }} />
      </span>
      <span className={styles.remaining}>
        {Math.round(cell.remaining)} <span className={styles.max}>/ {Math.round(max)}</span>
      </span>
    </>
  )
}

export function QiStatusChip({ status }: { status: QiCastStatus }) {
  const { t } = useI18n()
  const label =
    status.kind === "broken"
      ? t("rotation.editor.qiLedgerBroken")
      : t("rotation.editor.qiLedgerImmune")
  return (
    <span className={status.kind === "broken" ? styles.statusBroken : styles.statusImmune}>
      {label} {status.leftSec.toFixed(2)}s
    </span>
  )
}
