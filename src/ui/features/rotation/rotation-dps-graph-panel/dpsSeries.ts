import type { Result } from "../../../../engine/types"

export interface DpsSample {
  timeSec: number
  dps: number
}

export interface DpsSeries {
  perSecond: DpsSample[]
  cumulative: DpsSample[]
}

function bucketEndsWithTailMerged(duration: number): number[] {
  const ends: number[] = []
  for (let second = 1; second + 1 <= duration; second++) ends.push(second)
  ends.push(duration)
  return ends
}

export function dpsSeries(result: Result): DpsSeries {
  const duration = result.rotationDuration
  const events = (result.timeline ?? [])
    .filter((event) => event.inWindow)
    .sort((left, right) => left.timeSec - right.timeSec)
  if (duration <= 0 || events.length === 0) return { perSecond: [], cumulative: [] }

  const perSecond: DpsSample[] = [{ timeSec: 0, dps: 0 }]
  const cumulative: DpsSample[] = [{ timeSec: 0, dps: 0 }]
  let nextEvent = 0
  let bucketStart = 0
  let damageSoFar = 0
  for (const bucketEnd of bucketEndsWithTailMerged(duration)) {
    let damage = 0
    while (nextEvent < events.length && events[nextEvent].timeSec <= bucketEnd) {
      damage += events[nextEvent].damage
      nextEvent++
    }
    damageSoFar += damage
    perSecond.push({ timeSec: bucketEnd, dps: damage / (bucketEnd - bucketStart) })
    cumulative.push({ timeSec: bucketEnd, dps: damageSoFar / bucketEnd })
    bucketStart = bucketEnd
  }
  return { perSecond, cumulative }
}
