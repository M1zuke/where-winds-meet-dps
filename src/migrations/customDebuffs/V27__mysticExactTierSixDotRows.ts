// v26 → v27 — a mystic art's tier-6 damage-over-time row is the exact in-game
// value. A Skill Editor copy seeded at v26 holds the rounded tier-6 row together
// with level rows built on it. Only a dot whose own row and whose tier-6 level
// row both still equal that rounded row takes the exact row: once a value
// differs, a stale copy and a deliberate edit are indistinguishable.
import { matchesRow, withRow, type HitRow } from "../customSkills/hitRows"
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

type TierRow = {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
}
type ExactSwap = { from: HitRow; rows: Record<string, TierRow> }

export const EXACT_SWAPS: readonly ExactSwap[] = [
  {
    from: [0.295506, 0.443259, 46.75, 0],
    rows: {
      "5": {
        physMultiplier: 0.2785286,
        attributeMultiplier: 0.4177929,
        physFixed: 34.3672,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 0.295506316,
        attributeMultiplier: 0.443259474,
        physFixed: 46.750032,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.483296, 2.224945, 330.4793, 0],
    rows: {
      "5": {
        physMultiplier: 1.36706190481,
        attributeMultiplier: 2.05059285721,
        physFixed: 265.739922357,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.48329637748,
        attributeMultiplier: 2.22494456621,
        physFixed: 330.479343881,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [0.235818, 0.353727, 37.6455, 0],
    rows: {
      "6": {
        physMultiplier: 0.235818254717,
        attributeMultiplier: 0.353727382076,
        physFixed: 37.6454716981,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.622006, 2.433009, 254.7984, 0],
    rows: {
      "5": {
        physMultiplier: 1.529628,
        attributeMultiplier: 2.294442,
        physFixed: 188.64,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.62200568,
        attributeMultiplier: 2.43300852,
        physFixed: 254.7984,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.530217, 2.295325, 242.4702, 0],
    rows: {
      "6": {
        physMultiplier: 1.53021667925,
        attributeMultiplier: 2.29532501887,
        physFixed: 242.470188679,
        attributeFixed: 0,
      },
    },
  },
]

type RowLike = Record<string, unknown>

const isRecord = (value: unknown): value is RowLike =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healDot(debuff: unknown): unknown {
  if (
    !isRecord(debuff) ||
    typeof debuff.id !== "string" ||
    !debuff.id.startsWith("debuff-mystic-") ||
    !isRecord(debuff.dot)
  )
    return debuff
  const levelRows = debuff.dot.levelRows
  if (!isRecord(levelRows) || !isRecord(levelRows.rows) || !isRecord(levelRows.rows["6"]))
    return debuff
  const tierSix = levelRows.rows["6"]
  const swap = EXACT_SWAPS.find(
    (candidate) =>
      matchesRow(debuff.dot as RowLike, candidate.from) && matchesRow(tierSix, candidate.from),
  )
  if (!swap) return debuff
  const top = swap.rows["6"]!
  return {
    ...debuff,
    dot: {
      ...withRow(debuff.dot, [
        top.physMultiplier,
        top.attributeMultiplier,
        top.physFixed,
        top.attributeFixed,
      ]),
      levelRows: { ...levelRows, rows: structuredClone(swap.rows) },
    },
  }
}

export const V27__mysticExactTierSixDotRows: CustomDebuffMigration = {
  to: 27,
  name: "V27__mysticExactTierSixDotRows",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs) ? blob.debuffs.map(healDot) : blob.debuffs
    return { ...blob, v: 27, debuffs }
  },
}
