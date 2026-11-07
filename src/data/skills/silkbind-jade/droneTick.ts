import { ATTUNE, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { BUFF } from "../buffs/ids"
import type { DebuffDotSpec } from "../../../engine/debuff"

// In-game values as of 2026-09-24.
export const DRONE_RECALL = {
  tag: WEAPON.umbrella,
  exemptSkillIds: [
    SKILL.hiddenSwordLight1,
    SKILL.hiddenSwordLight2,
    SKILL.hiddenSwordLight3,
    SKILL.hiddenSwordLight4,
    SKILL.hiddenSwordLight5,
    SKILL.hiddenSwordHeavy1,
    SKILL.hiddenSwordHeavy2,
    SKILL.hiddenSwordHeavy3,
    SKILL.hiddenSwordHeavyAlt,
  ],
}

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
}

// In-game values as of 2026-10-15: each run's bullet flies at 30 m/s for at
// most 1 s from the umbrella and lands on the target.
export const DRONE_BULLET_PROJECTILE = {
  speedMetersPerSecond: 30,
  maxTravelFrames: 60,
}

// In-game values as of 2026-10-02: the Blossoms-gated drone fires one extra
// bullet at +9 f on a run that starts while the target carries the caster's
// own Lingering Bone, and that run costs its own Blossoms. The fixed
// hit-count variants have no Blossoms to pay it from, so they never get the
// extra bullet.
export const DRONE_LINGERING_BONE_ADDITIONAL_TICKS = {
  offsetsFrames: [9],
  requiresBuff: BUFF.lingeringBone,
} as const

export function droneDotSpec(withLingeringBoneBullet: boolean): DebuffDotSpec {
  return {
    tickIntervalFrames: DRONE_INTERVAL_FRAMES,
    firstTickOffsetFrames: DRONE_FIRST_TICK_OFFSET_FRAMES,
    // In-game timer values as of 2026-10-15.
    rearmsToAbsoluteDeadline: true,
    ...DRONE_TICK,
    attributeAttack: "Silkbind",
    // In-game hit type as of 2026-10-15: a direct hit of the umbrella's own
    // weapon skills, so no damage-over-time effect and no Sustain boost reaches it.
    skillType: "weapon",
    directHit: true,
    projectile: DRONE_BULLET_PROJECTILE,
    attuneTag: ATTUNE.umbFrequentProjectile,
    count: 1,
    perStackShapes: null,
    ...(withLingeringBoneBullet ? { additionalTicks: DRONE_LINGERING_BONE_ADDITIONAL_TICKS } : {}),
  }
}
