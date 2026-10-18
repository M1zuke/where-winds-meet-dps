import { SET_ID } from "../../../../data/sets/ids"
import type { BowSet } from "../../../../engine/types"

// In-game values as of 2026-10-17.
const GEAR_SET_BY_SUFFIX: Readonly<Record<number, string>> = {
  1: SET_ID.jadeware,
  3: SET_ID.hawkwing,
  7: SET_ID.rainwhisper,
  9: SET_ID.swiftGale,
  11: SET_ID.swayingHeights,
  23: SET_ID.swallowcall,
  25: SET_ID.mistwillow,
  29: SET_ID.ivorybloom,
  34: SET_ID.starweave,
  50: SET_ID.cleftpeak,
  56: SET_ID.etherwrath,
  79: SET_ID.tiltrim,
}

// In-game values as of 2026-10-17.
const BOW_SET_BY_SUFFIX: Readonly<Record<number, Exclude<BowSet, null>>> = {
  44: "precision",
  45: "crit",
  46: "affinity",
}

export function gearSetForSuffix(suffix: number | null): string | null {
  return suffix === null ? null : (GEAR_SET_BY_SUFFIX[suffix] ?? null)
}

export function bowSetForSuffix(suffix: number | null): BowSet {
  return suffix === null ? null : (BOW_SET_BY_SUFFIX[suffix] ?? null)
}
