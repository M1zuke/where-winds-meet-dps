import { mulberry32 } from "../rng"

const WINDOW_SEC = 10
const FOCUS_MAX = 50
const FOCUS_DECAY_DELAY_SEC = 3
const FOCUS_DECAY_STEP_SEC = 0.1
const FOCUS_DECAY_PER_STEP = 0.5
const SEED_OFFSET = 9173
const SIM_RUNS = 500
const TIME_EPSILON_SEC = 1e-6

export interface ConcentrationRules {
  eventTimesSec: readonly number[]
  rollProbability: number
  focusPerAffinity: number
  rollBonusWhileActive: number
  rollBonusWhileActiveAfterFirstDamage: number
}

export interface ConcentrationSchedule {
  readonly firstEventSec: number
  getActiveProbAtTime(tSec: number): number
}

const INACTIVE_SCHEDULE: ConcentrationSchedule = {
  firstEventSec: Infinity,
  getActiveProbAtTime: () => 0,
}

function countBelow(sorted: Float64Array, value: number): number {
  let low = 0
  let high = sorted.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (sorted[middle] < value) low = middle + 1
    else high = middle
  }
  return low
}

function countAtMost(sorted: Float64Array, value: number): number {
  let low = 0
  let high = sorted.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (sorted[middle] <= value) low = middle + 1
    else high = middle
  }
  return low
}

function focusAt(focusAtDecayStart: number, decayStartSec: number, timeSec: number): number {
  if (timeSec <= decayStartSec) return focusAtDecayStart
  const steps = Math.floor((timeSec - decayStartSec) / FOCUS_DECAY_STEP_SEC + TIME_EPSILON_SEC)
  return Math.max(0, focusAtDecayStart - FOCUS_DECAY_PER_STEP * steps)
}

function simulateRun(
  rules: ConcentrationRules,
  rng: () => number,
  segmentStarts: number[],
  segmentEnds: number[],
): void {
  let focusAtDecayStart = 0
  let decayStartSec = -Infinity
  let segmentStartSec = Infinity
  let concentrationEndSec = -Infinity
  const closeSegment = () => {
    segmentStarts.push(segmentStartSec)
    segmentEnds.push(concentrationEndSec)
    concentrationEndSec = -Infinity
  }

  rules.eventTimesSec.forEach((timeSec, eventIndex) => {
    if (concentrationEndSec > -Infinity && timeSec >= concentrationEndSec - TIME_EPSILON_SEC) {
      closeSegment()
    }
    const concentrationUp =
      concentrationEndSec > -Infinity && timeSec > segmentStartSec + TIME_EPSILON_SEC
    const targetHasTakenDamage = eventIndex > 0
    const probability = Math.min(
      1,
      rules.rollProbability +
        (concentrationUp
          ? rules.rollBonusWhileActive +
            (targetHasTakenDamage ? rules.rollBonusWhileActiveAfterFirstDamage : 0)
          : 0),
    )
    if (!(rng() < probability)) return

    const focus = focusAt(focusAtDecayStart, decayStartSec, timeSec)
    const raisedFocus = Math.min(FOCUS_MAX, focus + rules.focusPerAffinity)
    if (raisedFocus <= focus) return
    focusAtDecayStart = raisedFocus
    decayStartSec = timeSec + FOCUS_DECAY_DELAY_SEC
    if (raisedFocus < FOCUS_MAX) return

    if (concentrationEndSec === -Infinity) segmentStartSec = timeSec
    concentrationEndSec = timeSec + WINDOW_SEC
  })
  if (concentrationEndSec > -Infinity) closeSegment()
}

export function concentrationActiveProbSchedule(
  rules: ConcentrationRules,
  runRng?: () => number,
): ConcentrationSchedule {
  if (rules.eventTimesSec.length === 0 || rules.rollProbability <= 0) return INACTIVE_SCHEDULE

  const simRuns = runRng ? 1 : SIM_RUNS
  const segmentStarts: number[] = []
  const segmentEnds: number[] = []
  for (let sim = 0; sim < simRuns; sim++) {
    simulateRun(rules, runRng ?? mulberry32(SEED_OFFSET + sim), segmentStarts, segmentEnds)
  }
  const sortedStarts = Float64Array.from(segmentStarts).sort()
  const sortedEnds = Float64Array.from(segmentEnds).sort()

  return {
    firstEventSec: rules.eventTimesSec[0],
    getActiveProbAtTime(tSec: number): number {
      const started = countBelow(sortedStarts, tSec - TIME_EPSILON_SEC)
      const ended = countAtMost(sortedEnds, tSec + TIME_EPSILON_SEC)
      return (started - ended) / simRuns
    },
  }
}
