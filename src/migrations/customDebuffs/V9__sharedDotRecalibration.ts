// v8 → v9 — Combustion, Smolder, Toad Poison and the Bitter Season tick were
// recalibrated to their in-game values, and Toad Poison and Flute Ripple
// became direct hits rather than damage-over-time ticks. A Skill Editor copy
// seeded before this still carries the old row. Only a copy still identical
// to what was seeded is rewritten: once a value differs, a stale copy and a
// deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

interface CoefficientRow {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
}

interface CoefficientSwap {
  idSuffix: string
  from: CoefficientRow
  to: CoefficientRow
}

const COMBUSTION_FIXED = {
  physMultiplier: 0.29545,
  attributeMultiplier: 0.443175,
  physFixed: 44.62,
}
const TOAD_POISON_OLD = { physMultiplier: 1.62189, attributeMultiplier: 1.62189, physFixed: 243.7 }
const TOAD_POISON_FIXED = {
  physMultiplier: 1.62189,
  attributeMultiplier: 2.432835,
  physFixed: 243.7,
}
const SMOLDER_FIXED = { physMultiplier: 0.23578, attributeMultiplier: 0.35367, physFixed: 35.95 }
const BITTER_SEASON_TICK_FIXED = { physMultiplier: 0.02, attributeMultiplier: 0, physFixed: 0 }
// Flute Ripple's coefficients did not change — only its hit type did.
const FLUTE_RIPPLE_ROW = {
  physMultiplier: 1.47645,
  attributeMultiplier: 2.214675,
  physFixed: 320.97,
}

const COEFFICIENT_SWAPS: readonly CoefficientSwap[] = [
  {
    idSuffix: "-combustion",
    from: { physMultiplier: 0.29545, attributeMultiplier: 0.29545, physFixed: 44.62 },
    to: COMBUSTION_FIXED,
  },
  { idSuffix: "-toad-poison", from: TOAD_POISON_OLD, to: TOAD_POISON_FIXED },
  {
    idSuffix: "-smolder",
    from: { physMultiplier: 0.24991, attributeMultiplier: 0.374865, physFixed: 37.74 },
    to: SMOLDER_FIXED,
  },
  // A duplicate copy that never claimed the shared `mystic` id at V8 still
  // carries the legacy per-class Smolder id.
  {
    idSuffix: "-dark-fire",
    from: { physMultiplier: 0.24991, attributeMultiplier: 0.374865, physFixed: 37.74 },
    to: SMOLDER_FIXED,
  },
  {
    idSuffix: "-bitter-season-tick",
    from: { physMultiplier: 0.15, attributeMultiplier: 0.225, physFixed: 0 },
    to: BITTER_SEASON_TICK_FIXED,
  },
]

// The two direct-hit conversions (Toad Poison and Flute Ripple): matched on
// the sustain shape a seeded copy still carries, since Flute Ripple's own
// coefficients never changed. Losing every `receives` entry along with the
// sustain tag follows from the same fix — neither reaches a DoT-only effect
// any more (CLAUDE.md's shared calculation rules).
const DIRECT_HIT_CONVERSIONS: readonly { idSuffix: string; row: CoefficientRow }[] = [
  { idSuffix: "-toad-poison", row: TOAD_POISON_OLD },
  { idSuffix: "-flute-ripple", row: FLUTE_RIPPLE_ROW },
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function coefficientsMatch(dot: Record<string, unknown>, row: CoefficientRow): boolean {
  return (
    dot.physMultiplier === row.physMultiplier &&
    dot.attributeMultiplier === row.attributeMultiplier &&
    dot.physFixed === row.physFixed
  )
}

export function recalibrateSharedDot(id: string, dot: unknown): unknown {
  if (!isRecord(dot)) return dot
  const swap = COEFFICIENT_SWAPS.find(
    (candidate) => id.endsWith(candidate.idSuffix) && coefficientsMatch(dot, candidate.from),
  )
  return swap ? { ...dot, ...swap.to } : dot
}

function isUnconvertedDirectHit(id: string, dot: unknown): boolean {
  if (!isRecord(dot) || dot.skillType !== "sustain") return false
  const conversion = DIRECT_HIT_CONVERSIONS.find((candidate) => id.endsWith(candidate.idSuffix))
  return !!conversion && coefficientsMatch(dot, conversion.row)
}

function migrateDebuff(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  const { id } = debuff
  const convert = isUnconvertedDirectHit(id, debuff.dot)
  const dot = recalibrateSharedDot(id, debuff.dot)
  const withDot = dot === debuff.dot ? debuff : { ...debuff, dot }
  if (!convert) return withDot
  return {
    ...withDot,
    dot: { ...(withDot.dot as Record<string, unknown>), skillType: "mystic", directHit: true },
    receives: [],
  }
}

export const V9__sharedDotRecalibration: CustomDebuffMigration = {
  to: 9,
  name: "V9__sharedDotRecalibration",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs) ? blob.debuffs.map(migrateDebuff) : blob.debuffs
    return { ...blob, v: 9, debuffs }
  },
}
