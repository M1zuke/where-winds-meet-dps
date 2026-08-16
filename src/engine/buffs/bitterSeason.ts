import { mulberry32 } from "../rng"

const STEP_SEC = 0.05
const SIM_RUNS = 500
const STACK_SEED_OFFSET = 40217
const POISON_SEED_OFFSET = 58601

export const BITTER_SEASON_TICK_SLUG = "bitter-season-tick"
export const BITTER_SEASON_MAX_STACKS = 5
export const BITTER_SEASON_STACK_DURATION_SEC = 10
export const BITTER_SEASON_ZENITH_EXTENSION_SEC = 10

export function bitterSeasonDebuffId(classId: string): string {
  return `debuff-${classId}-${BITTER_SEASON_TICK_SLUG}`
}

// Resolved per tier by `bitterSeasonTuningAtTier` (`src/data/innerWays/bitterSeason.ts`).
export interface BitterSeasonTuning {
  procChance: number
  defenseReductionPerStack: number
  physPenetrationAtMaxStacks: number
}

export interface BitterSeasonStackSchedule {
  expectedStacksAtTime(tSec: number): number
  maxStackProbAtTime(tSec: number): number
}

const ZERO_STACK_SCHEDULE: BitterSeasonStackSchedule = {
  expectedStacksAtTime: () => 0,
  maxStackProbAtTime: () => 0,
}

export function bitterSeasonStackSchedule(
  hitTimesSec: readonly number[],
  procChance: number,
  rotationDurationSec: number,
  runRng?: () => number,
): BitterSeasonStackSchedule {
  if (hitTimesSec.length === 0 || rotationDurationSec <= 0 || procChance <= 0) {
    return ZERO_STACK_SCHEDULE
  }

  const steps = Math.ceil(rotationDurationSec / STEP_SEC) + 1
  const stackAccum = new Float64Array(steps)
  const maxStackAccum = new Float64Array(steps)
  const simRuns = runRng ? 1 : SIM_RUNS

  for (let sim = 0; sim < simRuns; sim++) {
    const rng = runRng ?? mulberry32(STACK_SEED_OFFSET + sim)
    let stacks = 0
    let windowEnd = -Infinity
    let hitIdx = 0
    for (let step = 0; step < steps; step++) {
      const now = step * STEP_SEC
      while (hitIdx < hitTimesSec.length && hitTimesSec[hitIdx] <= now) {
        const hitTime = hitTimesSec[hitIdx]
        if (stacks > 0 && hitTime >= windowEnd) stacks = 0
        if (rng() < procChance) {
          stacks = Math.min(stacks + 1, BITTER_SEASON_MAX_STACKS)
          windowEnd = hitTime + BITTER_SEASON_STACK_DURATION_SEC
        }
        hitIdx++
      }
      if (stacks > 0 && now >= windowEnd) stacks = 0
      stackAccum[step] += stacks
      if (stacks === BITTER_SEASON_MAX_STACKS) maxStackAccum[step] += 1
    }
  }

  const expectedStacks = new Float64Array(steps)
  const maxStackProb = new Float64Array(steps)
  for (let step = 0; step < steps; step++) {
    expectedStacks[step] = stackAccum[step] / simRuns
    maxStackProb[step] = maxStackAccum[step] / simRuns
  }

  return {
    expectedStacksAtTime(tSec: number): number {
      if (tSec <= 0) return expectedStacks[0]
      const idx = Math.min(Math.floor(tSec / STEP_SEC), steps - 1)
      return expectedStacks[idx]
    },
    maxStackProbAtTime(tSec: number): number {
      if (tSec <= 0) return maxStackProb[0]
      const idx = Math.min(Math.floor(tSec / STEP_SEC), steps - 1)
      return maxStackProb[idx]
    },
  }
}

export interface BitterSeasonPoisonSchedule {
  activeProbAtTime(tSec: number): number
  remainingActiveSecAtTime(tSec: number): number
}

const ZERO_POISON_SCHEDULE: BitterSeasonPoisonSchedule = {
  activeProbAtTime: () => 0,
  remainingActiveSecAtTime: () => 0,
}

export function bitterSeasonPoisonSchedule(
  hitTimesSec: readonly number[],
  procChance: number,
  poisonDurationSec: number,
  rotationDurationSec: number,
  extensionTimesSec: readonly number[],
  // The ceiling an extension may leave on the REMAINING duration, from the
  // extending moment. `Infinity` when the build has no extension source.
  maxRemainingSec: number,
  runRng?: () => number,
): BitterSeasonPoisonSchedule {
  if (
    hitTimesSec.length === 0 ||
    rotationDurationSec <= 0 ||
    procChance <= 0 ||
    poisonDurationSec <= 0
  ) {
    return ZERO_POISON_SCHEDULE
  }

  const steps = Math.ceil(rotationDurationSec / STEP_SEC) + 1
  const accum = new Float64Array(steps)
  // Expected remaining active time ASSUMING NO FURTHER HITS from that step
  // on — i.e. `max(0, poisonEnd - now)` per sim, averaged. Unlike
  // `activeProbAtTime` (which keeps counting future hits and so stays high
  // through a dense rotation), this decays to 0 the moment hits actually
  // stop landing — the number the "Remaining" display wants.
  const remainingAccum = new Float64Array(steps)
  const simRuns = runRng ? 1 : SIM_RUNS

  for (let sim = 0; sim < simRuns; sim++) {
    const rng = runRng ?? mulberry32(POISON_SEED_OFFSET + sim)
    let poisonEnd = -Infinity
    let hitIdx = 0
    let extIdx = 0
    for (let step = 0; step < steps; step++) {
      const now = step * STEP_SEC
      for (;;) {
        const nextHitTime = hitIdx < hitTimesSec.length ? hitTimesSec[hitIdx] : Infinity
        const nextExtTime = extIdx < extensionTimesSec.length ? extensionTimesSec[extIdx] : Infinity
        if (nextHitTime > now && nextExtTime > now) break
        if (nextHitTime <= nextExtTime) {
          if (rng() < procChance) poisonEnd = Math.max(poisonEnd, nextHitTime + poisonDurationSec)
          hitIdx++
        } else {
          // See `ZENITH_MAX_EXTENDED_DURATION_FRAMES` (builtinBuffs.ts).
          if (poisonEnd > nextExtTime) {
            poisonEnd = Math.max(
              poisonEnd,
              Math.min(
                poisonEnd + BITTER_SEASON_ZENITH_EXTENSION_SEC,
                nextExtTime + maxRemainingSec,
              ),
            )
          }
          extIdx++
        }
      }
      accum[step] += now < poisonEnd ? 1 : 0
      remainingAccum[step] += Math.max(0, poisonEnd - now)
    }
  }

  const activeProb = new Float64Array(steps)
  const expectedRemaining = new Float64Array(steps)
  for (let step = 0; step < steps; step++) {
    activeProb[step] = accum[step] / simRuns
    expectedRemaining[step] = remainingAccum[step] / simRuns
  }

  const indexAt = (tSec: number): number =>
    tSec <= 0 ? 0 : Math.min(Math.floor(tSec / STEP_SEC), steps - 1)

  return {
    activeProbAtTime(tSec: number): number {
      return activeProb[indexAt(tSec)]
    },
    remainingActiveSecAtTime(tSec: number): number {
      return expectedRemaining[indexAt(tSec)]
    },
  }
}

export interface BitterSeasonEnvelopeWindow {
  startSec: number
  endSec: number
}

// The guaranteed-proc (procChance = 1) envelope of `bitterSeasonPoisonSchedule`,
// deterministically. Because a real proc chance can only end a run earlier
// than this, `activeProbAtTime` is provably 0 outside these windows — so they
// bound tick emission without dropping any expected damage.
export function bitterSeasonEnvelopeWindows(
  hitTimesSec: readonly number[],
  poisonDurationSec: number,
  extensionTimesSec: readonly number[],
  maxRemainingSec: number,
): BitterSeasonEnvelopeWindow[] {
  if (hitTimesSec.length === 0 || poisonDurationSec <= 0) return []

  const windows: BitterSeasonEnvelopeWindow[] = []
  let currentStart: number | null = null
  let currentEnd = -Infinity
  let hitIdx = 0
  let extIdx = 0
  while (hitIdx < hitTimesSec.length || extIdx < extensionTimesSec.length) {
    const nextHitTime = hitIdx < hitTimesSec.length ? hitTimesSec[hitIdx] : Infinity
    const nextExtTime = extIdx < extensionTimesSec.length ? extensionTimesSec[extIdx] : Infinity
    if (nextHitTime <= nextExtTime) {
      if (currentStart === null || nextHitTime > currentEnd) {
        if (currentStart !== null) windows.push({ startSec: currentStart, endSec: currentEnd })
        currentStart = nextHitTime
        currentEnd = nextHitTime + poisonDurationSec
      } else {
        currentEnd = Math.max(currentEnd, nextHitTime + poisonDurationSec)
      }
      hitIdx++
    } else {
      // See `ZENITH_MAX_EXTENDED_DURATION_FRAMES` (builtinBuffs.ts).
      if (currentStart !== null && currentEnd > nextExtTime) {
        currentEnd = Math.max(
          currentEnd,
          Math.min(currentEnd + BITTER_SEASON_ZENITH_EXTENSION_SEC, nextExtTime + maxRemainingSec),
        )
      }
      extIdx++
    }
  }
  if (currentStart !== null) windows.push({ startSec: currentStart, endSec: currentEnd })
  return windows
}
