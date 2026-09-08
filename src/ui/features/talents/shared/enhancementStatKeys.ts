import type { EnhancementStat } from "../../../../engine/types"

export const ENHANCEMENT_STAT_KEYS: Readonly<Record<EnhancementStat, string>> = {
  minPhys: "common.minPhys",
  maxPhys: "common.maxPhys",
  maxHp: "content.statLine.maxHp",
  physDef: "content.statLine.physDef",
}
