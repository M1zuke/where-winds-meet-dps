import { useMemo } from "react"
import type { GearPiece } from "../../../../engine/types"
import type { RetunementRow } from "../../../../engine/dpsWorker"
import type { RetunementReason } from "../../../hooks/useRetunementAnalysis"
import { statLineLabel } from "../../../../data/stats/statLines"
import { useI18n } from "../../../../i18n/i18nContext"
import retunement from "../shared/retunement.module.scss"

interface Props {
  piece: GearPiece | null
  rows: RetunementRow[]
  reason: RetunementReason
  isPending: boolean
}

interface Pick {
  slotIndex: number
  currentWord: string
  word: string
  deltaDps: number
  legalCount: number
}

function fmtDpsDelta(deltaDps: number): string {
  const rounded = Math.round(deltaDps)
  if (rounded > 0) return `+${rounded.toLocaleString()}`
  if (rounded < 0) return rounded.toLocaleString()
  return "+0"
}

function deltaSignClass(deltaDps: number): string {
  if (deltaDps > 0.5) return "is-positive"
  if (deltaDps < -0.5) return "is-negative"
  return "is-zero"
}

function fmtChance(legalCount: number): string {
  if (legalCount <= 0) return "—"
  const pct = (100 / legalCount).toFixed(1)
  return `1 / ${legalCount} (${pct} %)`
}

export function RetunementAnalyzerPanel({ piece, rows, reason, isPending }: Props) {
  const { t } = useI18n()

  const countBySlot = useMemo(() => {
    const counts = new Map<number, number>()
    for (const row of rows) {
      if (!row.legal) continue
      counts.set(row.slotIndex, (counts.get(row.slotIndex) ?? 0) + 1)
    }
    return counts
  }, [rows])

  const best: Pick | null = useMemo(() => {
    if (!piece) return null
    let pick: Pick | null = null
    for (const row of rows) {
      if (!row.legal || row.isCurrent) continue
      if (!pick || row.deltaDps > pick.deltaDps) {
        pick = {
          slotIndex: row.slotIndex,
          currentWord: piece.words[row.slotIndex]?.word ?? "",
          word: row.word,
          deltaDps: row.deltaDps,
          legalCount: countBySlot.get(row.slotIndex) ?? 0,
        }
      }
    }
    return pick
  }, [piece, rows, countBySlot])

  const recommended = best !== null && best.deltaDps > 0

  const focusSlotCandidates: Pick[] = useMemo(() => {
    if (!piece || !best) return []
    const out: Pick[] = []
    for (const row of rows) {
      if (row.slotIndex !== best.slotIndex) continue
      if (!row.legal || row.isCurrent) continue
      out.push({
        slotIndex: row.slotIndex,
        currentWord: piece.words[row.slotIndex]?.word ?? "",
        word: row.word,
        deltaDps: row.deltaDps,
        legalCount: best.legalCount,
      })
    }
    out.sort((rowA, rowB) => rowB.deltaDps - rowA.deltaDps)
    return out
  }, [piece, rows, best])

  if (!piece) {
    return (
      <div className={`panel ${retunement.panel}`}>
        <div className="toolbar">
          <span className="toolbar-label">{t("Retunement")}</span>
        </div>
        <div className="hint">{t("Select a gear piece to analyze retunement gains")}</div>
      </div>
    )
  }

  if (reason === "relayed") {
    return (
      <div className={`panel ${retunement.panel}`}>
        <div className="toolbar">
          <span className="toolbar-label">{t("Retunement")}</span>
        </div>
        <div className="hint">{t("Relayed gear cannot be retuned")}</div>
      </div>
    )
  }

  if (reason === "no-pool") {
    return (
      <div className={`panel ${retunement.panel}`}>
        <div className="toolbar">
          <span className="toolbar-label">{t("Retunement")}</span>
        </div>
        <div className="hint">{t("No retunement data for this class yet")}</div>
      </div>
    )
  }

  const lockedSlots = piece.words
    .map((word, slotIndex) => (slotIndex > 0 && word.retuned ? slotIndex : -1))
    .filter((slotIndex) => slotIndex >= 0)
  const lockedNote =
    lockedSlots.length > 0 ? t("R-locked: only Slot ") + (lockedSlots[0] + 1) + t("") : null

  const hasRows = rows.length > 0

  return (
    <div className={`panel ${retunement.panel}`}>
      <div className="toolbar">
        <span className="toolbar-label">{t("Retunement")}</span>
        {isPending && <span className="hint">{t("Computing…")}</span>}
        {lockedNote && <span className="hint">{lockedNote}</span>}
      </div>

      {!hasRows && isPending && <div className="hint">{t("Computing…")}</div>}

      {best && (
        <div className={retunement.best}>
          <div className={retunement.bestRow}>
            <span className={retunement.bestLabel}>
              {recommended ? t("Best retune") : t("Least loss")}
            </span>
            <span className={retunement.bestSlot}>
              {t("Slot ") + (best.slotIndex + 1) + t("")}
              {best.currentWord ? ` (${t("Active")}: ${t(statLineLabel(best.currentWord))})` : ""}
              {" → "}
              <strong>{t(statLineLabel(best.word))}</strong>
            </span>
            <span className={`${retunement.bestDelta} ${deltaSignClass(best.deltaDps)}`}>
              {fmtDpsDelta(best.deltaDps)} DPS
            </span>
          </div>
          <div className={retunement.bestRow}>
            <span className={retunement.bestLabel}>{t("Success")}</span>
            <span>{fmtChance(best.legalCount)}</span>
          </div>
          {!recommended && (
            <div className={retunement.warn}>{t("Not recommended to retune this piece")}</div>
          )}
        </div>
      )}

      {focusSlotCandidates.length > 0 && (
        <div className={retunement.table}>
          <div className={retunement.th}>{t("Tunements")}</div>
          <div className={retunement.th}>{t("Δ")}</div>
          {focusSlotCandidates.map((candidate) => {
            const sign = deltaSignClass(candidate.deltaDps)
            return (
              <div key={`${candidate.slotIndex}-${candidate.word}`} style={{ display: "contents" }}>
                <div className={retunement.cell}>{t(statLineLabel(candidate.word))}</div>
                <div className={`${retunement.cell} ${sign}`}>
                  {fmtDpsDelta(candidate.deltaDps)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
