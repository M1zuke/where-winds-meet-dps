import { useMemo } from "react"
import type { QiTrace, Result } from "../../../../../engine/types"
import { useI18n } from "../../../../../i18n/i18nContext"
import { fightClockSec } from "../../fightClock"
import { buildQiLedger, formatQiDelta, qiBreakSpans } from "../../qiLedger"
import styles from "./TargetQiLane.module.scss"

const VIEW_WIDTH = 1000
const VIEW_HEIGHT = 100

function markerClassName(fraction: number, status: "broken" | "immune" | undefined): string {
  if (status === "broken") return styles.markerBroken
  if (status === "immune") return styles.markerImmune
  if (fraction > 0.5) return styles.markerHigh
  if (fraction > 0.25) return styles.markerMid
  return styles.markerLow
}

export function TargetQiLane({
  trace,
  result,
  minTime,
  duration,
  pct,
}: {
  trace: QiTrace
  result: Result
  minTime: number
  duration: number
  pct: (sec: number) => number
}) {
  const { t } = useI18n()
  const max = trace.max
  const ledger = useMemo(() => buildQiLedger(trace, result.casts ?? []), [trace, result.casts])
  const points = trace.points.map((point) => ({
    ...point,
    timeSec: fightClockSec(result, point.timeSec),
  }))
  const valueAt = (timeSec: number): number => {
    let value = max
    for (const point of points) {
      if (point.timeSec > timeSec) break
      value = point.value
    }
    return value
  }
  const clampTime = (timeSec: number) => Math.min(duration, Math.max(minTime, timeSec))
  const xOf = (timeSec: number) => (pct(clampTime(timeSec)) / 100) * VIEW_WIDTH
  const yOf = (value: number) => (max > 0 ? (1 - value / max) * VIEW_HEIGHT : VIEW_HEIGHT)
  const fractionOf = (value: number) => (max > 0 ? Math.max(0, Math.min(1, value / max)) : 0)

  const steps = points
    .filter((point) => point.timeSec > minTime && point.timeSec <= duration)
    .map((point) => `H${xOf(point.timeSec)} V${yOf(point.value)}`)
  const line = `M0,${yOf(valueAt(minTime))} ${steps.join(" ")} H${VIEW_WIDTH}`
  const area = `${line} V${VIEW_HEIGHT} H0 Z`

  const spans = qiBreakSpans(trace).map((span) => ({
    ...span,
    startSec: fightClockSec(result, span.startSec),
    endSec: fightClockSec(result, span.endSec),
    directImmunityEndSec:
      span.directImmunityEndSec === null ? null : fightClockSec(result, span.directImmunityEndSec),
  }))
  const visible = (startSec: number, endSec: number) => endSec > minTime && startSec < duration
  const bandStyle = (startSec: number, endSec: number) => ({
    left: `${pct(clampTime(startSec))}%`,
    width: `${pct(clampTime(endSec)) - pct(clampTime(startSec))}%`,
  })

  const castMarkers = (result.casts ?? [])
    .map((cast) => ({ cast, timeSec: fightClockSec(result, cast.timeSec) }))
    .filter(({ timeSec }) => timeSec >= minTime && timeSec <= duration)

  return (
    <div className={styles.group}>
      <div className={styles.stepLabels}>
        <span
          className={`${styles.stepLabel} ${styles.alignStart} ${styles.labelHigh}`}
          style={{ left: "0%" }}
        >
          {Math.round(valueAt(minTime))}
        </span>
        {spans
          .filter((span) => visible(span.startSec, span.endSec))
          .flatMap((span) => [
            <span
              key={`break:${span.startSec}`}
              className={`${styles.stepLabel} ${styles.labelBreak}`}
              style={{ left: `${pct(clampTime(span.startSec))}%` }}
            >
              0 — {t("rotation.timeline.qiBreakLabel")}
            </span>,
            span.endSec <= duration ? (
              <span
                key={`refill:${span.endSec}`}
                className={`${styles.stepLabel} ${styles.labelHigh}`}
                style={{ left: `${pct(span.endSec)}%` }}
              >
                {Math.round(span.refill)} — {t("rotation.timeline.qiRefillLabel")}
              </span>
            ) : null,
          ])}
        <span
          className={`${styles.stepLabel} ${styles.alignEnd} ${styles.labelHigh}`}
          style={{ left: "100%" }}
        >
          {Math.round(valueAt(duration))}
        </span>
      </div>
      <div className={styles.lane}>
        {spans
          .filter((span) => visible(span.startSec, span.endSec))
          .map((span) => (
            <div
              key={`band:${span.startSec}`}
              className={styles.breakBand}
              style={bandStyle(span.startSec, span.endSec)}
              title={`${t("common.qiBreak")} — ${span.startSec.toFixed(2)}s – ${span.endSec.toFixed(2)}s`}
            />
          ))}
        {spans
          .filter(
            (span) =>
              span.directImmunityEndSec !== null && visible(span.endSec, span.directImmunityEndSec),
          )
          .map((span) => (
            <div
              key={`immunity:${span.endSec}`}
              className={styles.immunityBand}
              style={bandStyle(span.endSec, span.directImmunityEndSec!)}
              title={`${t("rotation.timeline.qiDirectImmunity")} — ${span.endSec.toFixed(2)}s – ${span.directImmunityEndSec!.toFixed(2)}s`}
            />
          ))}
        <svg
          className={styles.curve}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={area} className={styles.area} />
          <path d={line} className={styles.line} vectorEffect="non-scaling-stroke" />
        </svg>
        {castMarkers.map(({ cast, timeSec }) => {
          const value = valueAt(timeSec)
          const cell = ledger.castCells.get(cast.index)
          return (
            <span
              key={cast.index}
              className={`${styles.marker} ${markerClassName(fractionOf(value), cell?.status?.kind)}`}
              style={{ left: `${pct(timeSec)}%`, top: `${yOf(value)}%` }}
              title={
                `${cast.skillName} — ${timeSec.toFixed(2)}s` +
                (cell
                  ? ` — ${formatQiDelta(cell.deltaQi)} → ${Math.round(cell.remaining)} / ${Math.round(max)}`
                  : "")
              }
            />
          )
        })}
      </div>
    </div>
  )
}
