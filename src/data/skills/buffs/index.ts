import type { BuffModule } from "../../../engine/buffs/buffModule"
import { healerBuff } from "./healerBuff"
import { revelryScript } from "./revelryScript"
import { fluteBoost } from "./fluteBoost"
import { vulnerabilityTeammate } from "./vulnerabilityTeammate"
import { jadeware } from "./jadeware"
import { mirage } from "./mirage"
import { mirageBonus } from "./mirageBonus"
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
  rainwhisperShield,
  resistanceResolve,
  surgingWaves,
  dragonHeadLowHp,
]

export const GROUP_BUFF_DEFS: BuffModule[] = [healerBuff]
