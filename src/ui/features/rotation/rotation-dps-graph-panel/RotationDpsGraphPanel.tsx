import { useMemo, useRef, useState } from "react"
import type { Result } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { dpsSeries, type DpsSample } from "./dpsSeries"
import styles from "./RotationDpsGraphPanel.module.scss"

const GRID_FRACTIONS = [1, 0.75, 0.5, 0.25, 0]
const AXIS_TICK_FRACTIONS = [0, 0.25, 0.5, 0.75, 1]
const NICE_STEPS = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
const TOOLTIP_FLIP_AT = 60

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
  const { perSecond, cumulative } = useMemo(() => dpsSeries(result), [result])
  const plotRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (perSecond.length < 2) {
    return <div className="empty-tab">{t("(none)")}</div>
  }

  const duration = result.rotationDuration
  const peakDps = Math.max(...perSecond.map((sample) => sample.dps))
  const axisTop = niceCeiling(peakDps)

  const xOf = (timeSec: number) => (timeSec / duration) * 100
  const yOf = (dps: number) => 100 - (dps / axisTop) * 100
  const pathOf = (series: DpsSample[]) =>
    series
      .map(
        (sample, index) => `${index === 0 ? "M" : "L"} ${xOf(sample.timeSec)} ${yOf(sample.dps)}`,
      )
      .join(" ")

  const linePath = pathOf(perSecond)
  const areaPath = `${linePath} L 100 100 L 0 100 Z`
  const cumulativePath = pathOf(cumulative)
  const averageY = yOf(result.dps)

  const hovered = hoveredIndex === null ? null : perSecond[hoveredIndex]
  const hoveredCumulative = hoveredIndex === null ? null : cumulative[hoveredIndex]

  function trackPointer(clientX: number) {
    const rect = plotRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const timeSec = ((clientX - rect.left) / rect.width) * duration
    let nearest = 0
    for (let index = 1; index < perSecond.length; index++) {
      const closer =
        Math.abs(perSecond[index].timeSec - timeSec) <
        Math.abs(perSecond[nearest].timeSec - timeSec)
      if (closer) nearest = index
    }
    setHoveredIndex(nearest)
  }

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
        <div
          ref={plotRef}
          className={styles.plot}
          onMouseMove={(event) => trackPointer(event.clientX)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
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
            <path className={styles.area} d={areaPath} />
            <path className={styles.line} d={linePath} />
            <path className={styles.cumulativeLine} d={cumulativePath} />
            <line className={styles.averageLine} x1="0" x2="100" y1={averageY} y2={averageY} />
          </svg>
          {hovered && (
            <>
              <div className={styles.hoverGuide} style={{ left: xOf(hovered.timeSec) + "%" }} />
              <div
                className={styles.hoverMarker}
                style={{ left: xOf(hovered.timeSec) + "%", top: yOf(hovered.dps) + "%" }}
              />
              <div
                className={
                  styles.hoverTooltip +
                  (xOf(hovered.timeSec) > TOOLTIP_FLIP_AT ? ` ${styles.flipped}` : "")
                }
                style={{ left: xOf(hovered.timeSec) + "%", top: yOf(hovered.dps) + "%" }}
              >
                <div className={styles.hoverTime}>{hovered.timeSec.toFixed(2)}s</div>
                <div className={styles.hoverDps}>
                  {fullNumber(hovered.dps)} {t("DPS")}
                </div>
                {hoveredCumulative && (
                  <div className={styles.hoverCumulative}>
                    {fullNumber(hoveredCumulative.dps)} {t("DPS so far")}
                  </div>
                )}
              </div>
            </>
          )}
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
          {t("DPS Over Time")}
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchCumulative}`} />
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
