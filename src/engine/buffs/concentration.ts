// Deliberate divergence from the site's `concentration` def
// (`.tmp/site/deobfuscated.js` ~L5570-5590): the site treats Concentration as
// always-on once the inner way is selected — its `counterMechanic` is present
// in the def's data but never actually evaluated at runtime in the extracted
// bundle. Here it's modeled as a game-accurate 4-hit ramp/10s window.
import { mulberry32 } from "../rng"

const STEP_SEC = 0.05
const WINDOW_SEC = 10
const REQUIRED_HITS = 4
const SEED_OFFSET = 9173
const SIM_RUNS = 500

export interface ConcentrationSchedule {
  getActiveProbAtTime(tSec: number): number
}

const INACTIVE_SCHEDULE: ConcentrationSchedule = { getActiveProbAtTime: () => 0 }

export function concentrationActiveProbSchedule(
  weaponHitTimesSec: readonly number[],
  p: number,
  rotationDurationSec: number,
  runRng?: () => number,
): ConcentrationSchedule {
  if (weaponHitTimesSec.length === 0 || rotationDurationSec <= 0 || p <= 0) return INACTIVE_SCHEDULE

  const steps = Math.ceil(rotationDurationSec / STEP_SEC) + 1
  const accum = new Float64Array(steps)
  const simRuns = runRng ? 1 : SIM_RUNS

  for (let sim = 0; sim < simRuns; sim++) {
    const rng = runRng ?? mulberry32(SEED_OFFSET + sim)
    let counter = 0
    let active = false
    let lastAffinityHitTime = -Infinity
    let hitIdx = 0
    for (let step = 0; step < steps; step++) {
      const now = step * STEP_SEC
      while (hitIdx < weaponHitTimesSec.length && weaponHitTimesSec[hitIdx] <= now) {
        const hitTime = weaponHitTimesSec[hitIdx]
        if (active && hitTime - lastAffinityHitTime > WINDOW_SEC) {
          active = false
          counter = 0
        }
        if (rng() < p) {
          lastAffinityHitTime = hitTime
          if (!active) {
            counter += 1
            if (counter >= REQUIRED_HITS) active = true
          }
        }
        hitIdx++
      }
      if (active && now - lastAffinityHitTime > WINDOW_SEC) {
        active = false
        counter = 0
      }
      accum[step] += active ? 1 : 0
    }
  }

  const activeProb = new Float64Array(steps)
  for (let step = 0; step < steps; step++) activeProb[step] = accum[step] / simRuns

  return {
    getActiveProbAtTime(tSec: number): number {
      if (tSec <= 0) return activeProb[0]
      const idx = Math.min(Math.floor(tSec / STEP_SEC), steps - 1)
      return activeProb[idx]
    },
  }
}
