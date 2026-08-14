import type { Result } from "../../../../engine/types"

export interface DpsSample {
  timeSec: number
  dps: number
}

export function runningDpsSeries(result: Result): DpsSample[] {
  const duration = result.rotationDuration
  if (duration <= 0) return []

  const events = (result.timeline ?? [])
    .filter((event) => event.inWindow)
    .sort((left, right) => left.timeSec - right.timeSec)

  const samples: DpsSample[] = []
  let cumulativeDamage = 0
  for (let index = 0; index < events.length; index++) {
    cumulativeDamage += events[index].damage
    const timeSec = events[index].timeSec
    if (timeSec <= 0) continue
    if (events[index + 1]?.timeSec === timeSec) continue
    samples.push({ timeSec, dps: cumulativeDamage / timeSec })
  }
  if (samples.length === 0) return []

  if (samples[samples.length - 1].timeSec < duration) {
    samples.push({ timeSec: duration, dps: cumulativeDamage / duration })
  }
  return samples
}
