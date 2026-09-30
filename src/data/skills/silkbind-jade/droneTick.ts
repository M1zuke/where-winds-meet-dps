import { ATTUNE } from "../ids"
import { BUFF } from "../buffs/ids"
import type { DebuffDotSpec } from "../../../engine/debuff"

// In-game values as of 2026-09-24.
export const DRONE_INTERVAL_FRAMES = 30
export const DRONE_FIRST_TICK_OFFSET_FRAMES = 33

export function droneWindowFrames(ticks: number): number {
  return DRONE_FIRST_TICK_OFFSET_FRAMES + (ticks - 1) * DRONE_INTERVAL_FRAMES + 1
}

// In-game values as of 2026-09-24.
export const DRONE_TICK = {
  physMultiplier: 0.510829,
  physFixed: 141.375,
  attributeMultiplier: 0.766243,
  attributeFixed: 77,
  extraCritDamage: 1,
  // In-game hit type as of 2026-09-25: a direct hit, not a DoT tick — decides
  // the post-break 4 s immunity only; the app still types the damage itself
  // as a DoT tick (docs/TIMELINE.md § "Qi bar").
  qiHitKind: "direct" as const,
}

// In-game values as of 2026-09-30: every drone run fires one extra bullet at
// +9 f whenever the target carries the caster's own Lingering Bone, the same
// behaviour for every hit-count variant.
export const DRONE_LINGERING_BONE_ADDITIONAL_TICKS = {
  offsetsFrames: [9],
  requiresBuff: BUFF.lingeringBone,
} as const

export function droneDotSpec(): DebuffDotSpec {
  return {
    tickIntervalFrames: DRONE_INTERVAL_FRAMES,
    firstTickOffsetFrames: DRONE_FIRST_TICK_OFFSET_FRAMES,
    ...DRONE_TICK,
    attributeAttack: "Silkbind",
    skillType: "sustain",
    attuneTag: ATTUNE.umbFrequentProjectile,
    count: 1,
    perStackShapes: null,
    additionalTicks: DRONE_LINGERING_BONE_ADDITIONAL_TICKS,
  }
}
