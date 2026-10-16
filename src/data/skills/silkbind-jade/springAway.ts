import { enduranceMeter } from "../../resources/enduranceMeter"
import { ATTACK, ATTUNE, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// In-game values as of 2026-10-06 (level 100).
export const SPRING_AWAY_BULLET = {
  physMultiplier: 0.286244,
  attributeMultiplier: 0.429367,
  physFixed: 79.16,
  attributeFixed: 43.16,
  extraCritDamage: 1,
}

const HOVER_STATE_FRAMES = 120
const RELEASE_CAST_FRAMES = 35.45
const SPRING_AWAY_CUE_FRACTIONS = [
  0.025, 0.105, 0.185, 0.275, 0.355, 0.435, 0.525, 0.605, 0.685, 0.775, 0.855, 0.935,
]

const hundredthsOf = (frames: number) => Math.round(frames * 100) / 100

// In-game values as of 2026-10-15: the hover starts after a 0.24 s hold and a
// 0.5 s lift keyframe.
export const SPRING_AWAY_HOVER_START_FRAME = hundredthsOf(0.74 * 60)

// In-game values as of 2026-10-15: each bullet spawns on a cue of the 2 s hover
// state, 3.0 to 112.2 f into it.
export const SPRING_AWAY_BULLET_LAUNCH_FRAMES = SPRING_AWAY_CUE_FRACTIONS.map((fraction) =>
  hundredthsOf(SPRING_AWAY_HOVER_START_FRAME + fraction * HOVER_STATE_FRAMES),
)

// In-game values as of 2026-10-15: 10 m/s, +700 m/s per second up to 80 m/s,
// collision armed 0.04 s after the spawn, 5 s lifetime, a 1 m long collision
// box whose leading edge touches the target 0.5 m before the bullet's origin
// does.
export const SPRING_AWAY_BULLET_PROJECTILE = {
  speedMetersPerSecond: 80,
  acceleration: { initialSpeedMetersPerSecond: 10, metersPerSecondSquared: 700 },
  collisionDelayFrames: 2.4,
  contactAdvanceMeters: 0.5,
  maxTravelFrames: 300,
}

// In-game values as of 2026-10-15: the cast runs on the Light Attack, whose
// approach range is 13 m.
export const SPRING_AWAY_REACH_METERS = 13

export const springAwayReleaseFrames = (bulletCount: number) =>
  hundredthsOf(SPRING_AWAY_BULLET_LAUNCH_FRAMES[bulletCount - 1] + RELEASE_CAST_FRAMES)

export const springAwayHoverSeconds = (bulletCount: number) =>
  Math.round(
    ((SPRING_AWAY_BULLET_LAUNCH_FRAMES[bulletCount - 1] - SPRING_AWAY_HOVER_START_FRAME) / 60) *
      10000,
  ) / 10000

export const springAwayHoverDrain = (stopAfterSec: number) => [
  {
    meterId: enduranceMeter.id,
    perSecond: 10,
    fromFrame: SPRING_AWAY_HOVER_START_FRAME,
    stopAfterSec,
  },
]

export const SPRING_AWAY_TAGS = [
  PROP.isCharged,
  PROP.hasQiBreakPhysPen,
  WEAPON.umbrella,
  ATTACK.light,
  ATTUNE.umbFrequentProjectile,
  ROLE.umbLightCharge,
]

export const SPRING_AWAY_RECEIVES = [
  BUFF.mistwillowHeavyBuff,
  BUFF.mistwillowBuff,
  BUFF.combo,
  BUFF.comboSpringAwayBonus,
  BUFF.comboExtendMark,
  BUFF.windWall,
  BUFF.pursuitChargedBoost,
  BUFF.trajectorySkill,
  BUFF.thunderousBloom,
  BUFF.springThunder,
  BUFF.nonPlayerBaseDamage125,
  ...VERNAL_UMBRELLA_RECEIVES,
]
