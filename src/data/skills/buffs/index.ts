import type { BuffModule } from "../../../engine/buffs/buffModule"
import { windWall } from "./windWall"
import { windWallPursuit } from "./windWallPursuit"
import { pursuitChargedBoost } from "./pursuitChargedBoost"
import { lingeringBone } from "./lingeringBone"
import { healerBuff } from "./healerBuff"
import { revelryScript } from "./revelryScript"
import { fluteBoost } from "./fluteBoost"
import { vulnerabilityTeammate } from "./vulnerabilityTeammate"
import { jadeware } from "./jadeware"
import { mirage } from "./mirage"
import { mirageBonus } from "./mirageBonus"
import { mistwillowBuff } from "./mistwillowBuff"
import { mistwillowHeavyBuff } from "./mistwillowHeavyBuff"
import { mistwillowLightBuff } from "./mistwillowLightBuff"
import { rainwhisperCritDamage } from "./rainwhisperCritDamage"
import { rainwhisperShield } from "./rainwhisperShield"
import { resistanceResolve } from "./resistanceResolve"
import { surgingWaves } from "./surgingWaves"
import { dragonHeadLowHp } from "./dragonHeadLowHp"

// Order is load-bearing (float addition is not associative): `fluteBoost` must
// stay ahead of the other five globals that emit `allDamageBoost`, so append
// nothing before it.
export const GLOBAL_BUFF_DEFS: BuffModule[] = [
  revelryScript,
  fluteBoost,
  vulnerabilityTeammate,
  jadeware,
  mirage,
  mirageBonus,
  rainwhisperCritDamage,
  rainwhisperShield,
  resistanceResolve,
  surgingWaves,
  dragonHeadLowHp,
  windWall,
  windWallPursuit,
  pursuitChargedBoost,
  lingeringBone,
  mistwillowBuff,
  mistwillowHeavyBuff,
  mistwillowLightBuff,
]

export const GROUP_BUFF_DEFS: BuffModule[] = [healerBuff]
