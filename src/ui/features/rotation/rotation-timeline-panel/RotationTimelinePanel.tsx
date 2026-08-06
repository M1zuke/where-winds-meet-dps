import { useMemo } from "react"
import type { Result, TimelineEvent } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import styles from "./RotationTimelinePanel.module.scss"

export function RotationTimelinePanel({ result }: { result: Result }) {
  const { t } = useI18n()
  const duration = result.rotationDuration
  const events = result.timeline ?? []

  const eventsByLane = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>()
    for (const event of result.timeline ?? []) {
      const existing = map.get(event.skillName)
      if (existing) existing.push(event)
      else map.set(event.skillName, [event])
    }
    return map
  }, [result.timeline])

  if (events.length === 0 || duration <= 0) {
    return <div className="empty-tab">{t("(none)")}</div>
  }

  const minTime = Math.min(0, ...events.map((event) => event.timeSec))
  const span = Math.max(duration - minTime, 1e-6)
  const pct = (sec: number) => ((sec - minTime) / span) * 100

  const axisTickFractions = [0, 0.25, 0.5, 0.75, 1]

  const qiBreak = result.qiBreakWindow
  const qiStart = qiBreak ? Math.max(qiBreak.startSec, minTime) : 0
  const qiEnd = qiBreak ? Math.min(qiBreak.endSec, duration) : 0
  const showQi = qiBreak != null && qiEnd > qiStart

  return (
    <div className={styles.timelinePanel}>
      <div className={styles.timelineScroll}>
        <div className={styles.timelineTrack}>
          {showQi && (
            <div className={styles.timelineBuffGroup}>
              <span className={styles.timelineBuffGroupLabel}>{t("Qi Break Window")}</span>
              <div className={styles.timelineBuffLane}>
                <div
                  className={`${styles.timelineBuffSpan} ${styles.timelineQiBreak}`}
                  style={{
                    left: pct(qiStart) + "%",
                    width: Math.max(pct(qiEnd) - pct(qiStart), 0.3) + "%",
                  }}
                  title={`${t("Qi Break Window")} — ${qiStart.toFixed(2)}s – ${qiEnd.toFixed(2)}s`}
                >
                  <span className={styles.timelineBuffLabel}>{t("Qi Break Window")}</span>
                </div>
              </div>
            </div>
          )}
          {[...eventsByLane.entries()].map(([name, laneEvents]) => (
            <div key={name} className={styles.timelineLane}>
              <span className={styles.timelineLaneLabel}>{t(name)}</span>
              <div className={styles.timelineLaneTrack}>
                {laneEvents.map((event, index) => (
                  <div
                    key={index}
                    className={
                      styles.timelineEvent +
                      (event.kind === "dot" ? ` ${styles.dot}` : "") +
                      (!event.inWindow ? ` ${styles.outOfWindow}` : "")
                    }
                    style={{ left: pct(event.timeSec) + "%" }}
                    title={`${event.skillName} — ${Math.max(0, event.timeSec).toFixed(2)}s — ${Math.round(event.damage).toLocaleString()}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.timelineAxis}>
          <div className={styles.timelineAxisTrack}>
            {axisTickFractions.map((fraction, index) => {
              const sec = minTime + fraction * span
              const alignment =
                index === 0
                  ? ` ${styles.alignStart}`
                  : index === axisTickFractions.length - 1
                    ? ` ${styles.alignEnd}`
                    : ""
              return (
                <span
                  key={fraction}
                  className={styles.timelineAxisTick + alignment}
                  style={{ left: pct(sec) + "%" }}
                >
                  {Math.max(0, sec).toFixed(1)}s
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
