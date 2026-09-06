import type { BuffModule } from "../../../engine/buffs/buffModule"
import { windWall } from "./windWall"
import { windWallPursuit } from "./windWallPursuit"
import { pursuitChargedBoost } from "./pursuitChargedBoost"
import { lingeringBone } from "./lingeringBone"
import { healerBuff } from "./healerBuff"
import { revelryScript } from "./revelryScript"
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
import { tiltrimStack } from "./tiltrimStack"
import { tiltrimInebriateBonus } from "./tiltrimInebriateBonus"
import { inebriateCritDamage } from "./inebriateCritDamage"
import { cloudvault } from "./cloudvault"
import { clashToastDamage } from "./clashToastDamage"
import { nonPlayerBaseDamage40, nonPlayerBaseDamage50 } from "./nonPlayerBaseDamage"

// Order is load-bearing (float addition is not associative): the globals that
// emit `allDamageBoost` sum in this order, so reorder none of them and insert
// nothing among them.
export const GLOBAL_BUFF_DEFS: BuffModule[] = [
  revelryScript,
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
  tiltrimStack,
  tiltrimInebriateBonus,
  inebriateCritDamage,
  cloudvault,
  clashToastDamage,
  nonPlayerBaseDamage40,
  nonPlayerBaseDamage50,
]

export const GROUP_BUFF_DEFS: BuffModule[] = [healerBuff]
