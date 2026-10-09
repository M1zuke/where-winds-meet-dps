// v10 → v11 — Bleeding, Combustion and Smolder now carry their own Qi rate
// instead of the in-game default 1. A Skill Editor copy seeded before this
// still carries no `qiRate` at all. Only a copy still holding the coefficient
// shape it was seeded with is rewritten: once a value differs, a stale copy
// and a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

interface CoefficientRow {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
}

interface QiRateHeal {
  idSuffix: string
  row: CoefficientRow
  qiRate: number
}

const QI_RATE_HEALS: readonly QiRateHeal[] = [
  {
    idSuffix: "-bleed-tick",
    row: { physMultiplier: 0.066, attributeMultiplier: 0.099, physFixed: 0 },
    qiRate: 0.2,
  },
  {
    idSuffix: "-combustion",
    row: { physMultiplier: 0.29545, attributeMultiplier: 0.443175, physFixed: 44.62 },
    qiRate: 0.6,
  },
  {
    idSuffix: "-smolder",
    row: { physMultiplier: 0.23578, attributeMultiplier: 0.35367, physFixed: 35.95 },
    qiRate: 0.6,
  },
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

export function healQiRateDefault(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  const id = debuff.id
  const dot = debuff.dot
  if (!isRecord(dot) || dot.qiRate !== undefined) return debuff
  const heal = QI_RATE_HEALS.find(
    (candidate) => id.endsWith(candidate.idSuffix) && coefficientsMatch(dot, candidate.row),
  )
  if (!heal) return debuff
  return { ...debuff, dot: { ...dot, qiRate: heal.qiRate } }
}

export const V11__qiRateDefaults: CustomDebuffMigration = {
  to: 11,
  name: "V11__qiRateDefaults",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs) ? blob.debuffs.map(healQiRateDefault) : blob.debuffs
    return { ...blob, v: 11, debuffs }
  },
}
