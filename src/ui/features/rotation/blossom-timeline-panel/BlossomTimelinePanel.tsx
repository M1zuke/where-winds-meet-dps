import { blossomResource } from "../../../../data/classes/silkbind-jade/blossoms"
import type { Result } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { fightClockSec } from "../fightClock"
import styles from "../../overview/blossom-panel/BlossomPanel.module.scss"
import layout from "./BlossomTimelinePanel.module.scss"

const REASON_KEYS = {
  depleted: "overview.blossoms.depleted",
  recalled: "overview.blossoms.recalled",
  insufficient: "overview.blossoms.insufficient",
  fightEnd: "overview.blossoms.fightEnd",
} as const

export function BlossomTimelinePanel({ result }: { result: Result }) {
  const { t } = useI18n()
  const resource = result.resources?.find((value) => value.id === blossomResource.id)
  const shift = (sec: number) => fightClockSec(result, sec)
  const samples = resource?.samples.map((sample) => ({ ...sample, timeSec: shift(sample.timeSec) }))
  const launches = resource?.launches.map((launch) => ({
    ...launch,
    timeSec: shift(launch.timeSec),
    endSec: shift(launch.endSec),
  }))
  const minTime = Math.min(0, ...(samples ?? []).map((sample) => sample.timeSec))
  const maxTime = Math.max(0.1, result.rotationDuration)
  const span = Math.max(maxTime - minTime, 0.1)
  const xOf = (sec: number) => 10 + ((sec - minTime) / span) * 380
  const points = samples?.map(({ timeSec, amount }) => `${xOf(timeSec)},${110 - amount}`).join(" ")
  const qiBreak = result.qiBreakWindow && {
    startSec: shift(result.qiBreakWindow.startSec),
    endSec: shift(result.qiBreakWindow.endSec),
  }
  return (
    <div className={`${styles.planner} ${layout.compact}`}>
      <h2>{t("overview.blossoms.title")}</h2>
      {resource ? (
        <>
          <svg viewBox="0 0 400 125" role="img" aria-label={t("overview.blossoms.chart")}>
            {qiBreak && (
              <rect
                x={xOf(Math.max(minTime, qiBreak.startSec))}
                y={10}
                width={Math.max(
                  0,
                  xOf(Math.min(maxTime, qiBreak.endSec)) - xOf(Math.max(minTime, qiBreak.startSec)),
                )}
                height={100}
                className={styles.breakWindow}
              />
            )}
            <path d="M10 10 V110 H390" className={styles.axis} />
            <path d="M10 60 H390" className={styles.threshold} />
            <polyline points={points} className={styles.curve} />
            <text x="12" y="123">
              {minTime.toFixed(2)} s
            </text>
            <text x="388" y="123" textAnchor="end">
              {maxTime.toFixed(2)} s
            </text>
          </svg>
          {qiBreak && (
            <p>
              {t("overview.blossoms.breakWindow")}: {qiBreak.startSec.toFixed(2)}–
              {qiBreak.endSec.toFixed(2)} s
            </p>
          )}
          <div className={`${styles.readout} ${layout.launches}`}>
            {launches?.map((launch, index) => (
              <div key={index}>
                <strong>
                  {launch.timeSec.toFixed(2)} s · {t(REASON_KEYS[launch.reason])}
                </strong>
                <div>
                  {launch.opening.toFixed(1)} → {launch.endAmount.toFixed(1)} ·{" "}
                  {(launch.endSec - launch.timeSec).toFixed(2)} s · {launch.ticks}{" "}
                  {t("overview.blossoms.projectiles")}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>{t("overview.blossoms.noResourceRotation")}</p>
      )}
    </div>
  )
}
