// Hawkwing 4-piece stack-probability `p = min(effectiveAffinityRate, 0.4)` is
// `.tmp/site/deobfuscated.js` ~L22956. The site resolves the stacking bonus
// via a seeded 500-run Monte-Carlo (`to()`, ~L20754-20813; PRNG `fr()`,
// ~L20653-20661) and applies the resulting TIME-AVERAGE bonus as a flat phys
// multiplier for the whole fight. This engine deliberately diverges: it
// samples the same simulation's per-step expectation every frame instead
// (`hawkwingStacksSchedule` below), rather than collapsing it to one average.
import { mulberry32 } from "../rng"

const STEP_SEC = 0.05
const DECAY_SEC = 5
const MAX_STACKS = 5
const BONUS_PER_STACK = 0.02
const SIM_RUNS = 500

export const HAWKWING_STEP_SEC = STEP_SEC
export const HAWKWING_MAX_STACKS = MAX_STACKS
export const HAWKWING_BONUS_PER_STACK = BONUS_PER_STACK

export interface HawkwingStacksSchedule {
  getExpectedStacksAtTime(tSec: number): number
}

const ZERO_HAWKWING_SCHEDULE: HawkwingStacksSchedule = { getExpectedStacksAtTime: () => 0 }

export function hawkwingStacksSchedule(
  hitTimesSec: readonly number[],
  p: number,
  rotationDurationSec: number,
  runRng?: () => number,
): HawkwingStacksSchedule {
  if (hitTimesSec.length === 0 || rotationDurationSec <= 0 || p <= 0) return ZERO_HAWKWING_SCHEDULE

  const steps = Math.ceil(rotationDurationSec / STEP_SEC) + 1
  const accum = new Float64Array(steps)
  const simRuns = runRng ? 1 : SIM_RUNS

  for (let sim = 0; sim < simRuns; sim++) {
    const rng = runRng ?? mulberry32(314 + sim)
    let stacks = 0
    let lastStackTime = -Infinity
    let hitIdx = 0
    for (let step = 0; step < steps; step++) {
      const now = step * STEP_SEC
      while (hitIdx < hitTimesSec.length && hitTimesSec[hitIdx] <= now) {
        const hitTime = hitTimesSec[hitIdx]
        if (stacks > 0 && hitTime - lastStackTime > DECAY_SEC) stacks = 0
        if (rng() < p) {
          stacks = Math.min(stacks + 1, MAX_STACKS)
          lastStackTime = hitTime
        }
        hitIdx++
      }
      if (stacks > 0 && now - lastStackTime > DECAY_SEC) stacks = 0
      accum[step] += stacks
    }
  }

  const expected = new Float64Array(steps)
  for (let step = 0; step < steps; step++) expected[step] = accum[step] / simRuns

  return {
    getExpectedStacksAtTime(tSec: number): number {
      if (tSec <= 0) return expected[0]
      const idx = Math.min(Math.floor(tSec / STEP_SEC), steps - 1)
      return expected[idx]
    },
  }
}
