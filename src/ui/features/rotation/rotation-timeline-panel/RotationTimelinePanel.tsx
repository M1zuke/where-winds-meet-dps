import { useMemo } from "react"
import type { Result, TimelineEvent } from "../../../../engine/types"
import { breakdownNameOf } from "../../../../engine/skill"
import { useI18n } from "../../../../i18n/i18nContext"
import styles from "./RotationTimelinePanel.module.scss"

export function RotationTimelinePanel({ result }: { result: Result }) {
  const { t } = useI18n()
  const duration = result.rotationDuration
  const events = result.timeline ?? []

  const lanes = useMemo(() => {
    const laneOf = new Map(
      result.perSkill.map((row) => [
        row.name,
        { name: breakdownNameOf(row.breakdownName, row.name), key: row.breakdownKey },
      ]),
    )
    const byName = new Map<string, { key: string; events: TimelineEvent[] }>()
    for (const event of result.timeline ?? []) {
      const lane = laneOf.get(event.skillName)
      const name = lane?.name ?? event.skillName
      const existing = byName.get(name)
      if (existing) existing.events.push(event)
      else byName.set(name, { key: lane?.key ?? name, events: [event] })
    }
    return byName
  }, [result.timeline, result.perSkill])

  if (events.length === 0 || duration <= 0) {
    return <div className="empty-tab">{t("common.none")}</div>
  }

  const minTime = Math.min(0, ...events.map((event) => event.timeSec))
  const span = Math.max(duration - minTime, 1e-6)
  const pct = (sec: number) => ((sec - minTime) / span) * 100

  const axisTickFractions = [0, 0.25, 0.5, 0.75, 1]

  const qiBreak = result.qiBreakWindow
  const qiStart = qiBreak ? Math.max(qiBreak.startSec, minTime) : 0
  const qiEnd = qiBreak ? Math.min(qiBreak.endSec, duration) : 0
  const showQi = qiBreak != null && qiEnd > qiStart

  const lowQi = result.lowQiWindow
  const lowQiStart = lowQi ? Math.max(lowQi.startSec, minTime) : 0
  const lowQiEnd = lowQi ? Math.min(lowQi.endSec, duration) : 0
  const showLowQi = lowQi != null && lowQiEnd > lowQiStart

  return (
    <div className={styles.timelinePanel}>
      <div className={styles.timelineScroll}>
        <div className={styles.timelineTrack}>
          {showLowQi && (
            <div className={styles.timelineBuffGroup}>
              <span className={styles.timelineBuffGroupLabel}>
                {t("rotation.timeline.lowQiWindow")}
              </span>
              <div className={styles.timelineBuffLane}>
                <div
                  className={`${styles.timelineBuffSpan} ${styles.timelineLowQi}`}
                  style={{
                    left: pct(lowQiStart) + "%",
                    width: Math.max(pct(lowQiEnd) - pct(lowQiStart), 0.3) + "%",
                  }}
                  title={`${t("rotation.timeline.lowQiWindow")} — ${lowQiStart.toFixed(2)}s – ${lowQiEnd.toFixed(2)}s`}
                >
                  <span className={styles.timelineBuffLabel}>
                    {t("rotation.timeline.lowQiWindow")}
                  </span>
                </div>
              </div>
            </div>
          )}
          {showQi && (
            <div className={styles.timelineBuffGroup}>
              <span className={styles.timelineBuffGroupLabel}>{t("common.qiBreakWindow")}</span>
              <div className={styles.timelineBuffLane}>
                <div
                  className={`${styles.timelineBuffSpan} ${styles.timelineQiBreak}`}
                  style={{
                    left: pct(qiStart) + "%",
                    width: Math.max(pct(qiEnd) - pct(qiStart), 0.3) + "%",
                  }}
                  title={`${t("common.qiBreakWindow")} — ${qiStart.toFixed(2)}s – ${qiEnd.toFixed(2)}s`}
                >
                  <span className={styles.timelineBuffLabel}>{t("common.qiBreakWindow")}</span>
                </div>
              </div>
            </div>
          )}
          {[...lanes.entries()].map(([name, lane]) => (
            <div key={name} className={styles.timelineLane}>
              <span className={styles.timelineLaneLabel}>{t(lane.key, name)}</span>
              <div className={styles.timelineLaneTrack}>
                {lane.events.map((event, index) => (
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
