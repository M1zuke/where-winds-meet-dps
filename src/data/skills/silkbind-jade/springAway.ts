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

// In-game timings as of 2026-10-08: bullets 1-9 as measured, 10-12 on their
// 9.75 f mean cadence. Four bullets always span under 30 f, which decides
// which bullets Combo - Extend Mark's 0.5 s cooldown lets through.
export const SPRING_AWAY_BULLET_FRAMES = [58, 66, 77, 87, 98, 107, 117, 126, 136, 146, 156, 165]

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
  BUFF.comboExtendMark,
  BUFF.windWall,
  BUFF.pursuitChargedBoost,
  BUFF.trajectorySkill,
  BUFF.thunderousBloom,
  BUFF.springThunder,
  BUFF.nonPlayerBaseDamage125,
  ...VERNAL_UMBRELLA_RECEIVES,
]
