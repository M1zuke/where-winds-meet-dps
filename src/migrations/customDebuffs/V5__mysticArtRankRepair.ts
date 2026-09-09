// v4 → v5 — every mystic art's damage-over-time row was re-authored to the
// values it has at the highest currently reachable rank. A Skill Editor copy
// seeded before that still carries the old row. Only a copy still identical
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

const TOAD_POISON_NEW = { physMultiplier: 1.62189, attributeMultiplier: 1.62189, physFixed: 243.7 }
const COMBUSTION_NEW = { physMultiplier: 0.29545, attributeMultiplier: 0.29545, physFixed: 44.62 }
const FLUTE_RIPPLE_NEW = { physMultiplier: 1.47645, attributeMultiplier: 2.214675, physFixed: 320.97 }
const DARK_FIRE_NEW = { physMultiplier: 0.24991, attributeMultiplier: 0.374865, physFixed: 37.74 }

const MYSTIC_DOT_RANK_SWAPS: readonly CoefficientSwap[] = [
  {
    idSuffix: "-toad-poison",
    from: { physMultiplier: 1.6216, attributeMultiplier: 1.6216, physFixed: 219 },
    to: TOAD_POISON_NEW,
  },
  {
    idSuffix: "-combustion",
    from: { physMultiplier: 0.2953, attributeMultiplier: 0.2953, physFixed: 39 },
    to: COMBUSTION_NEW,
  },
  {
    idSuffix: "-flute-ripple",
    from: { physMultiplier: 1.4614, attributeMultiplier: 2.1921, physFixed: 300 },
    to: FLUTE_RIPPLE_NEW,
  },
  {
    idSuffix: "-flute-ripple",
    from: { physMultiplier: 1.4696, attributeMultiplier: 2.2044, physFixed: 310 },
    to: FLUTE_RIPPLE_NEW,
  },
  {
    idSuffix: "-dark-fire",
    from: { physMultiplier: 0.236, attributeMultiplier: 0.354, physFixed: 44 },
    to: DARK_FIRE_NEW,
  },
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healMysticDotRank(id: string, dot: unknown): unknown {
  if (!isRecord(dot)) return dot
  for (const swap of MYSTIC_DOT_RANK_SWAPS) {
    if (!id.endsWith(swap.idSuffix)) continue
    const untouched =
      dot.physMultiplier === swap.from.physMultiplier &&
      dot.attributeMultiplier === swap.from.attributeMultiplier &&
      dot.physFixed === swap.from.physFixed
    if (untouched) return { ...dot, ...swap.to }
  }
  return dot
}

export const V5__mysticArtRankRepair: CustomDebuffMigration = {
  to: 5,
  name: "V5__mysticArtRankRepair",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map((debuff) =>
          isRecord(debuff) && typeof debuff.id === "string"
            ? { ...debuff, dot: healMysticDotRank(debuff.id, debuff.dot) }
            : debuff,
        )
      : blob.debuffs
    return { ...blob, v: 5, debuffs }
  },
}
