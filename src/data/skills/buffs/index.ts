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

// Order is load-bearing (float addition is not associative): `revelryScript`
// and `fluteBoost` are prepended because they used to sit ahead of every
// other global via Bellstrike Umbra's own `classBuffDefs`; appending them
// would move `fluteBoost`'s `allDamageBoost` behind the other five globals
// that emit the same stat key for no reason.
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
