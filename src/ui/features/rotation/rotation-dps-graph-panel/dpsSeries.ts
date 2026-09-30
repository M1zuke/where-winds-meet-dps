import type { Result } from "../../../../engine/types"

export interface DpsSample {
  timeSec: number
  dps: number
}

export interface DpsSeries {
  perSecond: DpsSample[]
  cumulative: DpsSample[]
}

function bucketEndsWithTailMerged(windowStartSec: number, windowEndSec: number): number[] {
  const ends: number[] = []
  for (let second = windowStartSec + 1; second + 1 <= windowEndSec; second++) ends.push(second)
  ends.push(windowEndSec)
  return ends
}

export function dpsSeries(result: Result): DpsSeries {
  const duration = result.rotationDuration
  const windowStart = result.fightStartSec
  const windowEnd = windowStart + duration
  const events = (result.timeline ?? [])
    .filter((event) => event.inWindow)
    .sort((left, right) => left.timeSec - right.timeSec)
  if (duration <= 0 || events.length === 0) return { perSecond: [], cumulative: [] }

  const perSecond: DpsSample[] = [{ timeSec: windowStart, dps: 0 }]
  const cumulative: DpsSample[] = [{ timeSec: windowStart, dps: 0 }]
  let nextEvent = 0
  let bucketStart = windowStart
  let damageSoFar = 0
  for (const bucketEnd of bucketEndsWithTailMerged(windowStart, windowEnd)) {
    let damage = 0
    while (nextEvent < events.length && events[nextEvent].timeSec <= bucketEnd) {
      damage += events[nextEvent].damage
      nextEvent++
    }
    damageSoFar += damage
    perSecond.push({ timeSec: bucketEnd, dps: damage / (bucketEnd - bucketStart) })
    cumulative.push({ timeSec: bucketEnd, dps: damageSoFar / (bucketEnd - windowStart) })
    bucketStart = bucketEnd
  }
  return { perSecond, cumulative }
}
