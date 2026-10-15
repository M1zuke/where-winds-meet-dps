// v12 → v13 — every mystic art's damage-over-time row was re-authored to the
// values it has at the new highest reachable level (76, or 176 with the
// breakthrough branch). A Skill Editor copy seeded before that still carries
// the old row. Only a copy still identical to what was seeded is rewritten:
// once a value differs, a stale copy and a deliberate edit are
// indistinguishable.
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

const LEVEL_CAP_SWAPS: readonly CoefficientSwap[] = [
  {
    idSuffix: "-combustion",
    from: { physMultiplier: 0.29545, attributeMultiplier: 0.443175, physFixed: 44.62 },
    to: { physMultiplier: 0.295506, attributeMultiplier: 0.443259, physFixed: 46.75 },
  },
  {
    idSuffix: "-smolder",
    from: { physMultiplier: 0.23578, attributeMultiplier: 0.35367, physFixed: 35.95 },
    to: { physMultiplier: 0.235818, attributeMultiplier: 0.353727, physFixed: 37.6455 },
  },
  {
    idSuffix: "-toad-poison",
    from: { physMultiplier: 1.62189, attributeMultiplier: 2.432835, physFixed: 243.7 },
    to: { physMultiplier: 1.622006, attributeMultiplier: 2.433009, physFixed: 254.7984 },
  },
  {
    idSuffix: "-toad-poison-fury",
    from: { physMultiplier: 1.530103, attributeMultiplier: 2.295155, physFixed: 231.9985 },
    to: { physMultiplier: 1.530217, attributeMultiplier: 2.295325, physFixed: 242.4702 },
  },
  {
    idSuffix: "-flute-ripple",
    from: { physMultiplier: 1.47645, attributeMultiplier: 2.214675, physFixed: 320.97 },
    to: { physMultiplier: 1.483296, attributeMultiplier: 2.224945, physFixed: 330.4793 },
  },
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healMysticDotLevelCap(id: string, dot: unknown): unknown {
  if (!isRecord(dot)) return dot
  for (const swap of LEVEL_CAP_SWAPS) {
    if (!id.endsWith(swap.idSuffix)) continue
    const untouched =
      dot.physMultiplier === swap.from.physMultiplier &&
      dot.attributeMultiplier === swap.from.attributeMultiplier &&
      dot.physFixed === swap.from.physFixed
    if (untouched) return { ...dot, ...swap.to }
  }
  return dot
}

export const V13__mysticArtLevelCap: CustomDebuffMigration = {
  to: 13,
  name: "V13__mysticArtLevelCap",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map((debuff) =>
          isRecord(debuff) && typeof debuff.id === "string"
            ? { ...debuff, dot: healMysticDotLevelCap(debuff.id, debuff.dot) }
            : debuff,
        )
      : blob.debuffs
    return { ...blob, v: 13, debuffs }
  },
}
