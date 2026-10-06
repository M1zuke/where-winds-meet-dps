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

// Spaced evenly across the hover's 2 s window: the in-game cue times are not
// readable.
export const SPRING_AWAY_FIRST_BULLET_FRAME = 58
export const SPRING_AWAY_BULLET_SPACING_FRAMES = 10

export const SPRING_AWAY_HOVER_START_FRAME = 44

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
  BUFF.windWall,
  BUFF.pursuitChargedBoost,
  BUFF.trajectorySkill,
  BUFF.thunderousBloom,
  BUFF.springThunder,
  BUFF.nonPlayerBaseDamage125,
  ...VERNAL_UMBRELLA_RECEIVES,
]
