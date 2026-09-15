import { blossomResource } from "../../../../data/classes/silkbind-jade/blossoms"
import type { Result } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
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
  const duration = Math.max(0.1, result.rotationDuration)
  const points =
    resource?.samples
      .map(({ timeSec, amount }) => `${10 + (timeSec / duration) * 380},${110 - amount}`)
      .join(" ") ?? ""
  return (
    <div className={`${styles.planner} ${layout.compact}`}>
      <h2>{t("overview.blossoms.title")}</h2>
      {resource ? (
        <>
          <svg viewBox="0 0 400 125" role="img" aria-label={t("overview.blossoms.chart")}>
            {result.qiBreakWindow && (
              <rect
                x={
                  10 +
                  (Math.min(duration, Math.max(0, result.qiBreakWindow.startSec)) / duration) * 380
                }
                y={10}
                width={
                  (Math.max(
                    0,
                    Math.min(duration, result.qiBreakWindow.endSec) -
                      Math.max(0, result.qiBreakWindow.startSec),
                  ) /
                    duration) *
                  380
                }
                height={100}
                className={styles.breakWindow}
              />
            )}
            <path d="M10 10 V110 H390" className={styles.axis} />
            <path d="M10 60 H390" className={styles.threshold} />
            <polyline points={points} className={styles.curve} />
            <text x="12" y="123">
              0 s
            </text>
            <text x="388" y="123" textAnchor="end">
              {duration.toFixed(2)} s
            </text>
          </svg>
          {result.qiBreakWindow && (
            <p>
              {t("overview.blossoms.breakWindow")}: {result.qiBreakWindow.startSec.toFixed(2)}–
              {result.qiBreakWindow.endSec.toFixed(2)} s
            </p>
          )}
          <div className={`${styles.readout} ${layout.launches}`}>
            {resource.launches.map((launch, index) => (
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
