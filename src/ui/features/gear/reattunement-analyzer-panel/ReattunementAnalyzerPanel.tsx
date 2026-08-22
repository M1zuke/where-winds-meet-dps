import { useMemo } from "react"
import type { GearPiece } from "../../../../engine/types"
import type { ReattunementOption } from "../../../../engine/dpsWorker"
import type { ReattunementReason } from "../../../hooks/useReattunementAnalysis"
import { useI18n } from "../../../../i18n/i18nContext"
import retunement from "../shared/retunement.module.scss"

interface Props {
  piece: GearPiece | null
  options: ReattunementOption[]
  probImproveOverall: number
  reason: ReattunementReason
  isPending: boolean
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

function fmtPct(fraction: number): string {
  if (!Number.isFinite(fraction)) return "—"
  if (fraction <= 0) return "0 %"
  if (fraction >= 1) return "100 %"
  return `${(fraction * 100).toFixed(1)} %`
}

function fmtRange(min: number, max: number): string {
  return `${(min * 100).toFixed(1)}–${(max * 100).toFixed(1)} %`
}

export function ReattunementAnalyzerPanel({
  piece,
  options,
  probImproveOverall,
  reason,
  isPending,
}: Props) {
  const { t } = useI18n()

  const sorted = useMemo(() => {
    return options.slice().sort((optionA, optionB) => optionB.deltaDpsAtMax - optionA.deltaDpsAtMax)
  }, [options])

  const best = sorted.length > 0 ? sorted[0] : null
  const recommended = best !== null && best.deltaDpsAtMax > 0

  if (!piece) {
    return (
      <div className={`panel ${retunement.panel}`}>
        <div className="toolbar">
          <span className="toolbar-label">{t("common.reattunement")}</span>
        </div>
        <div className="hint">{t("gear.reattunementAnalyzer.selectAGearPieceTo")}</div>
      </div>
    )
  }

  if (reason === "no-pool") {
    return (
      <div className={`panel ${retunement.panel}`}>
        <div className="toolbar">
          <span className="toolbar-label">{t("common.reattunement")}</span>
        </div>
        <div className="hint">{t("gear.reattunementAnalyzer.noAttunementOptionsAvailableFor")}</div>
      </div>
    )
  }

  return (
    <div className={`panel ${retunement.panel}`}>
      <div className="toolbar">
        <span className="toolbar-label">{t("common.reattunement")}</span>
        {isPending && <span className="hint">{t("gear.reattunementAnalyzer.computing")}</span>}
      </div>

      {sorted.length === 0 && isPending && (
        <div className="hint">{t("gear.reattunementAnalyzer.computing")}</div>
      )}

      {best && (
        <div className={retunement.best}>
          <div className={retunement.bestRow}>
            <span className={retunement.bestLabel}>
              {recommended
                ? t("gear.reattunementAnalyzer.bestAttunement")
                : t("gear.reattunementAnalyzer.leastLoss")}
            </span>
            <span className={retunement.bestSlot}>
              <strong>{t(best.labelKey, best.label)}</strong>
              {" @ "}
              {(best.max * 100).toFixed(1)} %
              {best.isCurrent && (
                <span className={retunement.tag} style={{ marginLeft: 6 }}>
                  {t("common.active")}
                </span>
              )}
            </span>
            <span className={`${retunement.bestDelta} ${deltaSignClass(best.deltaDpsAtMax)}`}>
              {fmtDpsDelta(best.deltaDpsAtMax)} DPS
            </span>
          </div>
          <div className={retunement.bestRow}>
            <span className={retunement.bestLabel}>
              {t("gear.reattunementAnalyzer.improveChance")}
            </span>
            <span>
              {fmtPct(probImproveOverall)}
              <span className="hint" style={{ marginLeft: 6 }}>
                {t("gear.reattunementAnalyzer.acrossTheWholePool")}
              </span>
            </span>
          </div>
          {!recommended && (
            <div className={retunement.warn}>
              {t("gear.reattunementAnalyzer.notRecommendedToReAttune")}
            </div>
          )}
        </div>
      )}

      {sorted.length > 0 && (
        <div className={retunement.reattunementTable}>
          <div className={retunement.th}>{t("common.attunement")}</div>
          <div className={retunement.th}>{t("gear.reattunementAnalyzer.range")}</div>
          <div className={retunement.th}>{t("gear.reattunementAnalyzer.symbol")}</div>
          {sorted.map((option) => {
            const sign = deltaSignClass(option.deltaDpsAtMax)
            return (
              <div key={option.optionId} style={{ display: "contents" }}>
                <div className={retunement.cell}>
                  {t(option.labelKey, option.label)}
                  {option.isCurrent && <span className={retunement.tag}>{t("common.active")}</span>}
                  {option.inert && (
                    <span className={retunement.tag}>{t("gear.reattunementAnalyzer.inert")}</span>
                  )}
                </div>
                <div className={retunement.cell}>{fmtRange(option.min, option.max)}</div>
                <div className={`${retunement.cell} ${sign}`}>
                  {fmtDpsDelta(option.deltaDpsAtMax)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
