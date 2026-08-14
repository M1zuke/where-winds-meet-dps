import { useMemo } from "react"
import type { Result } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { runningDpsSeries } from "./dpsSeries"
import styles from "./RotationDpsGraphPanel.module.scss"

const GRID_FRACTIONS = [1, 0.75, 0.5, 0.25, 0]
const AXIS_TICK_FRACTIONS = [0, 0.25, 0.5, 0.75, 1]

const NICE_STEPS = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]

function niceCeiling(value: number): number {
  if (!(value > 0)) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = NICE_STEPS.find((candidate) => candidate * magnitude >= value)
  return (step ?? 10) * magnitude
}

const compact = (value: number) => {
  if (value >= 10000) return (value / 1000).toFixed(0) + "k"
  if (value >= 1000) return (value / 1000).toFixed(1) + "k"
  return value.toFixed(0)
}

const fullNumber = (value: number) => Math.round(value).toLocaleString("en-US")

export function RotationDpsGraphPanel({ result }: { result: Result }) {
  const { t } = useI18n()
  const samples = useMemo(() => runningDpsSeries(result), [result])

  if (samples.length < 2) {
    return <div className="empty-tab">{t("(none)")}</div>
  }

  const duration = result.rotationDuration
  const peakDps = Math.max(...samples.map((sample) => sample.dps))
  const axisTop = niceCeiling(peakDps)

  const xOf = (timeSec: number) => (timeSec / duration) * 100
  const yOf = (dps: number) => 100 - (dps / axisTop) * 100

  const linePoints = samples
    .map((sample) => `${xOf(sample.timeSec).toFixed(3)},${yOf(sample.dps).toFixed(3)}`)
    .join(" ")
  const areaPoints = `${xOf(samples[0].timeSec).toFixed(3)},100 ${linePoints} ${xOf(
    samples[samples.length - 1].timeSec,
  ).toFixed(3)},100`
  const averageY = yOf(result.dps).toFixed(3)

  return (
    <div className={styles.graphPanel}>
      <div className={styles.plotRow}>
        <div className={styles.yAxis}>
          {GRID_FRACTIONS.map((fraction) => (
            <span
              key={fraction}
              className={styles.yAxisLabel}
              style={{ top: (1 - fraction) * 100 + "%" }}
            >
              {compact(axisTop * fraction)}
            </span>
          ))}
        </div>
        <div className={styles.plot}>
          <svg
            className={styles.chart}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${t("DPS Graph")} — ${fullNumber(result.dps)} ${t("DPS")}`}
          >
            {GRID_FRACTIONS.map((fraction) => (
              <line
                key={fraction}
                className={styles.gridLine}
                x1="0"
                x2="100"
                y1={(1 - fraction) * 100}
                y2={(1 - fraction) * 100}
              />
            ))}
            <polygon className={styles.area} points={areaPoints} />
            <polyline className={styles.line} points={linePoints} />
            <line className={styles.averageLine} x1="0" x2="100" y1={averageY} y2={averageY} />
          </svg>
        </div>
      </div>
      <div className={styles.xAxis}>
        <div className={styles.xAxisTrack}>
          {AXIS_TICK_FRACTIONS.map((fraction, index) => {
            const alignment =
              index === 0
                ? ` ${styles.alignStart}`
                : index === AXIS_TICK_FRACTIONS.length - 1
                  ? ` ${styles.alignEnd}`
                  : ""
            return (
              <span
                key={fraction}
                className={styles.xAxisTick + alignment}
                style={{ left: fraction * 100 + "%" }}
              >
                {(duration * fraction).toFixed(1)}s
              </span>
            )
          })}
        </div>
      </div>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchLine}`} />
          {t("DPS so far")}
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchAverage}`} />
          {t("Rotation DPS")}
          <span className={styles.legendValue}>{fullNumber(result.dps)}</span>
        </span>
        <span className={styles.legendItem}>
          {t("Peak")}
          <span className={styles.legendValue}>{fullNumber(peakDps)}</span>
        </span>
      </div>
    </div>
  )
}
