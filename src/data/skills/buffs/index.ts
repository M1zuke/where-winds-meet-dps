import type { BuffModule } from "../../../engine/buffs/buffModule"
import { healerBuff } from "./healerBuff"
import { vulnerabilityTeammate } from "./vulnerabilityTeammate"
import { jadeware } from "./jadeware"
import { mirage } from "./mirage"
import { mirageBonus } from "./mirageBonus"
import { rainwhisperShield } from "./rainwhisperShield"
import { resistanceResolve } from "./resistanceResolve"
import { surgingWaves } from "./surgingWaves"
import { dragonHeadLowHp } from "./dragonHeadLowHp"

export const GLOBAL_BUFF_DEFS: BuffModule[] = [
  vulnerabilityTeammate,
  jadeware,
  mirage,
  mirageBonus,
  rainwhisperShield,
  resistanceResolve,
  surgingWaves,
  dragonHeadLowHp,
]

export const GROUP_BUFF_DEFS: BuffModule[] = [healerBuff]
