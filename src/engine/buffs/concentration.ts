import { mulberry32 } from "../rng"
import type { MechanicObservedEvent } from "../mechanics/types"

const WINDOW_SEC = 10
const FOCUS_MAX = 50
const FOCUS_DECAY_DELAY_SEC = 3
const FOCUS_DECAY_STEP_SEC = 0.1
const FOCUS_DECAY_PER_STEP = 0.5
const SEED_OFFSET = 9173
const SIM_RUNS = 500
const TIME_EPSILON_SEC = 1e-6

export interface ConcentrationRules {
  focusPerAffinity: number
  chanceBonusWhileActive: number
}

interface Trajectory {
  random: () => number
  focusAtDecayStart: number
  decayStartSec: number
  segmentStartSec: number
  segmentEndSec: number
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

function focusAt(trajectory: Trajectory, timeSec: number): number {
  if (timeSec <= trajectory.decayStartSec) return trajectory.focusAtDecayStart
  const steps = Math.floor(
    (timeSec - trajectory.decayStartSec) / FOCUS_DECAY_STEP_SEC + TIME_EPSILON_SEC,
  )
  return Math.max(0, trajectory.focusAtDecayStart - FOCUS_DECAY_PER_STEP * steps)
}

const isOpen = (trajectory: Trajectory) => trajectory.segmentEndSec > -Infinity

export class ConcentrationTracker {
  private readonly trajectories: Trajectory[]
  private readonly closedStarts: number[] = []
  private readonly closedEnds: number[] = []
  private history: { starts: Float64Array; ends: Float64Array } | null = null

  constructor(
    private readonly rules: ConcentrationRules,
    runRandom?: () => number,
  ) {
    const count = runRandom ? 1 : SIM_RUNS
    this.trajectories = Array.from({ length: count }, (_unused, index) => ({
      random: runRandom ?? mulberry32(SEED_OFFSET + index),
      focusAtDecayStart: 0,
      decayStartSec: -Infinity,
      segmentStartSec: Infinity,
      segmentEndSec: -Infinity,
    }))
  }

  activeShareNow(timeSec: number): number {
    let up = 0
    for (const trajectory of this.trajectories)
      if (trajectory.segmentEndSec - timeSec > TIME_EPSILON_SEC) up++
    return up / this.trajectories.length
  }

  // A window opens after the event that fills Focus, so a query at that event's
  // own time reads it as down.
  activeShareAtTime(timeSec: number): number {
    if (!this.history) {
      const starts = [...this.closedStarts]
      const ends = [...this.closedEnds]
      for (const trajectory of this.trajectories) {
        if (!isOpen(trajectory)) continue
        starts.push(trajectory.segmentStartSec)
        ends.push(trajectory.segmentEndSec)
      }
      this.history = {
        starts: Float64Array.from(starts).sort(),
        ends: Float64Array.from(ends).sort(),
      }
    }
    const started = countBelow(this.history.starts, timeSec - TIME_EPSILON_SEC)
    const ended = countAtMost(this.history.ends, timeSec + TIME_EPSILON_SEC)
    return (started - ended) / this.trajectories.length
  }

  observe(event: MechanicObservedEvent): void {
    this.history = null
    if (event.occurrence <= 0) return
    for (const trajectory of this.trajectories) {
      if (isOpen(trajectory) && event.timeSec >= trajectory.segmentEndSec - TIME_EPSILON_SEC) {
        this.closedStarts.push(trajectory.segmentStartSec)
        this.closedEnds.push(trajectory.segmentEndSec)
        trajectory.segmentStartSec = Infinity
        trajectory.segmentEndSec = -Infinity
      }
      if (event.occurrence < 1 && !(trajectory.random() < event.occurrence)) continue
      const concentrationUp = isOpen(trajectory)
      const chance = Math.min(
        1,
        event.affinityChance + (concentrationUp ? this.rules.chanceBonusWhileActive : 0),
      )
      const rolledAffinity = event.rolledAffinity ?? trajectory.random() < chance
      if (!rolledAffinity) continue

      const focus = focusAt(trajectory, event.timeSec)
      const raisedFocus = Math.min(FOCUS_MAX, focus + this.rules.focusPerAffinity)
      if (raisedFocus <= focus) continue
      trajectory.focusAtDecayStart = raisedFocus
      trajectory.decayStartSec = event.timeSec + FOCUS_DECAY_DELAY_SEC
      if (raisedFocus < FOCUS_MAX) continue

      if (!isOpen(trajectory)) trajectory.segmentStartSec = event.timeSec
      trajectory.segmentEndSec = event.timeSec + WINDOW_SEC
    }
  }
}
