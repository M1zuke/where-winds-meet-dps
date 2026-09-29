import type { BuffModule } from "../../../engine/buffs/buffModule"
import { windWall } from "./windWall"
import { windWallPursuit } from "./windWallPursuit"
import { pursuitChargedBoost } from "./pursuitChargedBoost"
import { lingeringBone } from "./lingeringBone"
import { healerBuff } from "./healerBuff"
import { wraithstrikeScript } from "./wraithstrikeScript"
import { voidrotScript } from "./voidrotScript"
import { vulnerabilityTeammate } from "./vulnerabilityTeammate"
import { cleftpeakStacks } from "./cleftpeakStacks"
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
import { herosBloodInebriateNoAbrasion } from "./herosBloodInebriateNoAbrasion"
import { clashToastDamage } from "./clashToastDamage"
import {
  nonPlayerBaseDamage10,
  nonPlayerBaseDamage40,
  nonPlayerBaseDamage50,
  nonPlayerBaseDamage115,
  nonPlayerBaseDamage125,
  nonPlayerBaseDamage145,
} from "./nonPlayerBaseDamage"
import { poetFinalStrikeStack } from "./poetFinalStrikeStack"
import { divinecraftFire } from "./divinecraftFire"
import { fluteArrival, fluteDistanceBonus } from "./fluteDistanceBonus"
import { cleftpeakDeflectGrant } from "./cleftpeakDeflectGrant"
import { toadVenomQiBonus } from "./toadVenomQiBonus"
import { ivorybloomFullHpBonus } from "./ivorybloomFullHpBonus"
import { starweaveMartialBoost } from "./starweaveMartialBoost"
import { swayingHeightsHighHpBonus } from "./swayingHeightsHighHpBonus"
import { etherwrathAttackBoost } from "./etherwrathAttackBoost"
import { etherwrathPenetrationBoost } from "./etherwrathPenetrationBoost"
import { swallowcallLightAttackBoost } from "./swallowcallLightAttackBoost"
import { swiftGaleAirborneHeavyBoost } from "./swiftGaleAirborneHeavyBoost"

// Order is load-bearing (float addition is not associative): the globals that
// emit `allDamageBoost` sum in this order, so reorder none of them and insert
// nothing among them.
export const GLOBAL_BUFF_DEFS: BuffModule[] = [
  wraithstrikeScript,
  voidrotScript,
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
  cleftpeakStacks,
  tiltrimStack,
  tiltrimInebriateBonus,
  inebriateCritDamage,
  cloudvault,
  herosBloodInebriateNoAbrasion,
  clashToastDamage,
  nonPlayerBaseDamage10,
  nonPlayerBaseDamage40,
  nonPlayerBaseDamage50,
  nonPlayerBaseDamage115,
  nonPlayerBaseDamage125,
  nonPlayerBaseDamage145,
  poetFinalStrikeStack,
  divinecraftFire,
  fluteArrival,
  fluteDistanceBonus,
  cleftpeakDeflectGrant,
  toadVenomQiBonus,
  ivorybloomFullHpBonus,
  starweaveMartialBoost,
  swayingHeightsHighHpBonus,
  etherwrathAttackBoost,
  etherwrathPenetrationBoost,
  swallowcallLightAttackBoost,
  swiftGaleAirborneHeavyBoost,
]

export const GROUP_BUFF_DEFS: BuffModule[] = [healerBuff]
