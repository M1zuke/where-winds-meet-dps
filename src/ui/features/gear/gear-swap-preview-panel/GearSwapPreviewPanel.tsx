import { useMemo } from "react"
import type { GearPiece, Inputs } from "../../../../engine/types"
import { applyPieceContribution, listKnownPaths } from "../../../../engine/gearStats"
import { effectiveRates } from "../../../../engine/panel"
import { useI18n } from "../../../../i18n/i18nContext"
import type { DpsDelta } from "../../../../engine/dpsWorker"
import {
  PERCENT_PATHS,
  PENETRATION_PATHS,
  readPath,
  statPathLabel,
} from "../../../utils/statFormatting"
import styles from "./GearSwapPreviewPanel.module.scss"

const RESISTANCE_RATE_PATHS = new Set(["precision", "critRate", "affinityRate"])

interface Props {
  inputs: Inputs
  candidate: GearPiece | null
  isEquipped: boolean
  currentDps: number
  dpsDelta: DpsDelta | undefined
  dpsDeltasPending: boolean
}

function fmtVal(value: number, isPercent: boolean, isPenetration = false): string {
  if (!Number.isFinite(value)) return "—"
  if (isPenetration) return String(Math.round(value * 1000) / 10)
  if (isPercent) return `${(value * 100).toFixed(2)}%`
  if (Math.abs(value) < 0.01 && value !== 0) return value.toFixed(4)
  return Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2)
}

function fmtDelta(value: number, isPercent: boolean, isPenetration = false): string {
  if (!Number.isFinite(value) || value === 0) return "—"
  const sign = value > 0 ? "+" : "−"
  const abs = Math.abs(value)
  if (isPenetration) return `${sign}${Math.round(abs * 1000) / 10}`
  if (isPercent) return `${sign}${(abs * 100).toFixed(2)}%`
  if (abs < 0.01) return `${sign}${abs.toFixed(4)}`
  return `${sign}${abs >= 100 ? abs.toFixed(0) : abs.toFixed(2)}`
}

function fmtDpsDelta(deltaDps: number): string {
  const rounded = Math.round(deltaDps)
  if (rounded > 0) return `+${rounded.toLocaleString()}`
  if (rounded < 0) return rounded.toLocaleString()
  return "+0"
}

function deltaSignClass(deltaDps: number): string {
  if (deltaDps > 0) return "is-positive"
  if (deltaDps < 0) return "is-negative"
  return "is-zero"
}

export function GearSwapPreviewPanel({
  inputs,
  candidate,
  isEquipped,
  currentDps,
  dpsDelta,
  dpsDeltasPending,
}: Props) {
  const { t } = useI18n()

  const rows = useMemo(() => {
    if (!candidate || isEquipped) return null
    const equippedId = inputs.equipped[candidate.slot]
    const equippedPiece = equippedId
      ? (inputs.inventory.find((piece) => piece.id === equippedId) ?? null)
      : null
    const baseline = equippedPiece ? applyPieceContribution(inputs, equippedPiece, -1) : inputs
    const after = applyPieceContribution(baseline, candidate, +1)
    const effBefore = effectiveRates(inputs)
    const effAfter = effectiveRates(after)
    return listKnownPaths()
      .map((path) => {
        const cur = readPath(inputs, path)
        const next = readPath(after, path)
        const delta = next - cur
        const isRate = RESISTANCE_RATE_PATHS.has(path)
        const key = path as "precision" | "critRate" | "affinityRate"
        const effCur = isRate ? effBefore[key] : undefined
        const effNext = isRate ? effAfter[key] : undefined
        const effDelta =
          effCur !== undefined && effNext !== undefined ? effNext - effCur : undefined
        return { path, cur, next, delta, effCur, effNext, effDelta }
      })
      .filter((row) => Math.abs(row.delta) > 1e-9)
  }, [inputs, candidate, isEquipped])

  if (!candidate || isEquipped || rows === null) return null

  const afterDps = dpsDelta ? currentDps + dpsDelta.current : null

  return (
    <div className={`panel ${styles.gearSwapPreview}`}>
      <div className="toolbar">
        <span className="toolbar-label">{t("gear.swapPreview.ifEquippedStatPreview")}</span>
      </div>

      <div className={styles.gearSwapDps}>
        <div className={styles.gearSwapDpsCell}>
          <div className={styles.label}>{t("gear.swapPreview.currentDps")}</div>
          <div className={styles.value}>{Math.round(currentDps).toLocaleString()}</div>
        </div>
        <div className={styles.gearSwapDpsCell}>
          <div className={styles.label}>{t("gear.swapPreview.afterEquipDps")}</div>
          <div className={styles.value}>
            {afterDps !== null
              ? Math.round(afterDps).toLocaleString()
              : dpsDeltasPending
                ? "…"
                : "—"}
          </div>
        </div>
        <div className={styles.gearSwapDpsCell}>
          <div className={styles.label}>{t("gear.swapPreview.symbol")}</div>
          <div
            className={`${styles.value} ${dpsDelta ? deltaSignClass(dpsDelta.current) : "is-zero"}`}
          >
            {dpsDelta ? `${fmtDpsDelta(dpsDelta.current)} DPS` : dpsDeltasPending ? "…" : "—"}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="hint">{t("gear.swapPreview.equippingThisPieceWouldNot")}</div>
      ) : (
        <div className={styles.gearSwapTable}>
          <div className={styles.gearBaseTh}>{t("common.stat")}</div>
          <div className={styles.gearBaseTh}>{t("common.active")}</div>
          <div className={styles.gearBaseTh}>{t("gear.swapPreview.after")}</div>
          <div className={styles.gearBaseTh}>{t("gear.swapPreview.symbol")}</div>
          {rows.map((row) => {
            const isPct = PERCENT_PATHS.has(row.path)
            const isPen = PENETRATION_PATHS.has(row.path)
            return (
              <Row
                key={row.path}
                label={statPathLabel(row.path, t)}
                cur={fmtVal(row.cur, isPct, isPen)}
                next={fmtVal(row.next, isPct, isPen)}
                delta={fmtDelta(row.delta, isPct, isPen)}
                sign={deltaSignClass(row.delta)}
                effCur={row.effCur !== undefined ? fmtVal(row.effCur, isPct, isPen) : undefined}
                effNext={row.effNext !== undefined ? fmtVal(row.effNext, isPct, isPen) : undefined}
                effDelta={
                  row.effDelta !== undefined ? fmtDelta(row.effDelta, isPct, isPen) : undefined
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  cur,
  next,
  delta,
  sign,
  effCur,
  effNext,
  effDelta,
}: {
  label: string
  cur: string
  next: string
  delta: string
  sign: string
  effCur?: string
  effNext?: string
  effDelta?: string
}) {
  return (
    <>
      <div className={styles.gearBaseCell}>{label}</div>
      <div className={styles.gearBaseCell}>
        {cur}
        {effCur && <span className={styles.eff}> → {effCur}</span>}
      </div>
      <div className={styles.gearBaseCell}>
        {next}
        {effNext && <span className={styles.eff}> → {effNext}</span>}
      </div>
      <div className={`${styles.gearBaseCell} ${sign}`}>
        {delta}
        {effDelta && <span className={styles.eff}> → {effDelta}</span>}
      </div>
    </>
  )
}
