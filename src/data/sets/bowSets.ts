import type { BowSet, GearLevelValues } from "../../engine/types"

export interface BowSetDef {
  name: string
  stat: "affinityRate" | "critRate" | "precisionRate"
  value: GearLevelValues
}

// In-game values as of 2026-10-15. Bows and thumb rings carry the set from gear level 91.
export const BOW_SET_DEFS: Readonly<Record<Exclude<BowSet, null>, BowSetDef>> = {
  precision: {
    name: "Fletchlodge",
    stat: "precisionRate",
    value: { 91: 0.033, 96: 0.04, 100: 0.047, 105: 0.054 },
  },
  crit: {
    name: "Stringshock",
    stat: "critRate",
    value: { 91: 0.037, 96: 0.045, 100: 0.052, 105: 0.061 },
  },
  affinity: {
    name: "Shadowchase",
    stat: "affinityRate",
    value: { 91: 0.018, 96: 0.022, 100: 0.026, 105: 0.03 },
  },
}
