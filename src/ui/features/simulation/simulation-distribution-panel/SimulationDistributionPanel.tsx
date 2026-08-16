import { useRef, useState } from "react"
import { useI18n } from "../../../../i18n/i18nContext"
import type { ParseRun } from "../../../../engine/dpsWorker"
import { compactDamage, decimalNumber, fixed, fullNumber } from "../damageFormat"
import { parseAtRank } from "../simulation-parse-ladder-panel/parseLadder"
import { parseHistogram } from "./parseHistogram"
import styles from "./SimulationDistributionPanel.module.scss"

const GRID_FRACTIONS = [1, 0.75, 0.5, 0.25, 0]
const AXIS_TICK_FRACTIONS = [0, 0.25, 0.5, 0.75, 1]
const NICE_STEPS = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
const TOOLTIP_FLIP_AT = 60
const BAR_GAP_FRACTION = 0.12

function niceCeiling(value: number): number {
  if (!(value > 0)) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = NICE_STEPS.find((candidate) => candidate * magnitude >= value)
  return (step ?? 10) * magnitude
}

export function SimulationDistributionPanel({
  sorted,
  meanDps,
  expectedDps,
  rotationDuration,
}: {
  sorted: readonly ParseRun[]
  meanDps: number
  expectedDps: number
  rotationDuration: number
}) {
  const { t } = useI18n()
  const plotRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const histogram = parseHistogram(sorted.map((run) => run.dps))
  if (histogram.bins.length === 0) return <div className="empty-tab">{t("(none)")}</div>

  const { bins, min, max, maxCount } = histogram
  const span = max - min
  const axisTop = niceCeiling(maxCount)
  const binSpan = 100 / bins.length
  const barGap = binSpan * BAR_GAP_FRACTION

  const median = parseAtRank(sorted, 50)!.dps
  const lowBand = parseAtRank(sorted, 20)!.dps
  const highBand = parseAtRank(sorted, 80)!.dps

  const xOf = (dps: number) => (span > 0 ? ((dps - min) / span) * 100 : 50)
  const yOf = (count: number) => 100 - (count / axisTop) * 100
  const damageOf = (dps: number) => dps * rotationDuration

  const showExpected = Number.isFinite(expectedDps) && expectedDps >= min && expectedDps <= max

  const hovered = hoveredIndex === null ? null : bins[hoveredIndex]

  function trackPointer(clientX: number) {
    const rect = plotRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const fraction = (clientX - rect.left) / rect.width
    const index = Math.floor(fraction * bins.length)
    setHoveredIndex(Math.min(bins.length - 1, Math.max(0, index)))
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
              {Math.round(axisTop * fraction)}
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
            aria-label={`${t("DPS Distribution")} — ${t("median")} ${decimalNumber(median, 2)} ${t("DPS")}, ${decimalNumber(min, 2)} ${t("to")} ${decimalNumber(max, 2)}`}
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
            <rect
              className={styles.band}
              x={xOf(lowBand)}
              width={Math.max(0, xOf(highBand) - xOf(lowBand))}
              y="0"
              height="100"
            />
            {bins.map((bin, index) => (
              <rect
                key={bin.start}
                className={styles.bar + (index === hoveredIndex ? ` ${styles.barHovered}` : "")}
                x={index * binSpan + barGap / 2}
                width={Math.max(binSpan - barGap, 0.2)}
                y={yOf(bin.count)}
                height={100 - yOf(bin.count)}
              />
            ))}
            {showExpected && (
              <line
                className={styles.expectedLine}
                x1={xOf(expectedDps)}
                x2={xOf(expectedDps)}
                y1="0"
                y2="100"
              />
            )}
            <line className={styles.meanLine} x1={xOf(meanDps)} x2={xOf(meanDps)} y1="0" y2="100" />
            <line className={styles.medianLine} x1={xOf(median)} x2={xOf(median)} y1="0" y2="100" />
          </svg>
          {hovered && (
            <>
              <div
                className={styles.hoverGuide}
                style={{ left: (hoveredIndex! + 0.5) * binSpan + "%" }}
              />
              <div
                className={
                  styles.hoverTooltip +
                  ((hoveredIndex! + 0.5) * binSpan > TOOLTIP_FLIP_AT ? ` ${styles.flipped}` : "")
                }
                style={{ left: (hoveredIndex! + 0.5) * binSpan + "%" }}
              >
                <div className={styles.hoverCount}>
                  {decimalNumber(hovered.start, 0)} – {decimalNumber(hovered.end, 0)} {t("DPS")}
                </div>
                <div className={styles.hoverRange}>
                  {compactDamage(damageOf(hovered.start))} – {compactDamage(damageOf(hovered.end))}{" "}
                  {t("dmg")}
                </div>
                <div className={styles.hoverShare}>
                  {fullNumber(hovered.count)} {t("runs")} ·{" "}
                  {fixed((hovered.count / sorted.length) * 100, 1)} %
                </div>
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
                {decimalNumber(min + span * fraction, 0)}
              </span>
            )
          })}
        </div>
      </div>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchMedian}`} />
          {t("Median")}
          <span className={styles.legendValue}>{decimalNumber(median, 2)}</span>
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchMean}`} />
          {t("Mean")}
          <span className={styles.legendValue}>{decimalNumber(meanDps, 2)}</span>
        </span>
        {showExpected && (
          <span className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles.swatchExpected}`} />
            {t("Expected")}
            <span className={styles.legendValue}>{decimalNumber(expectedDps, 2)}</span>
          </span>
        )}
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchBand}`} />
          {t("p20–p80")}
        </span>
      </div>
    </div>
  )
}
