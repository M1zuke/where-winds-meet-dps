// v25 → v26 — a mystic art's damage-over-time row reads its tier row at the
// breakthrough's mystic tier. A Skill Editor copy seeded before this holds the
// single tier-6 row it was seeded with and ignores the breakthrough. Only a dot
// still holding exactly that row gains the tier rows: once a value differs, a
// stale copy and a deliberate edit are indistinguishable.
import { matchesRow, type HitRow } from "../customSkills/hitRows"
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

type TierRow = {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
}
type TierTable = { scale: "mysticTier"; rows: Record<string, TierRow> }

const TIER_TABLES: Record<string, TierTable> = {
  combustionDot: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 0.2785286,
        attributeMultiplier: 0.4177929,
        physFixed: 34.3672,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 0.295506,
        attributeMultiplier: 0.443259,
        physFixed: 46.75,
        attributeFixed: 0,
      },
    },
  },
  fluteStrike: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 1.36706190481,
        attributeMultiplier: 2.05059285721,
        physFixed: 265.739922357,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.483296,
        attributeMultiplier: 2.224945,
        physFixed: 330.4793,
        attributeFixed: 0,
      },
    },
  },
  smolderDot: {
    scale: "mysticTier",
    rows: {
      "6": {
        physMultiplier: 0.235818,
        attributeMultiplier: 0.353727,
        physFixed: 37.6455,
        attributeFixed: 0,
      },
    },
  },
  toadPoisonDot: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 1.529628,
        attributeMultiplier: 2.294442,
        physFixed: 188.64,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.622006,
        attributeMultiplier: 2.433009,
        physFixed: 254.7984,
        attributeFixed: 0,
      },
    },
  },
  toadPoisonFuryDot: {
    scale: "mysticTier",
    rows: {
      "6": {
        physMultiplier: 1.530217,
        attributeMultiplier: 2.295325,
        physFixed: 242.4702,
        attributeFixed: 0,
      },
    },
  },
}

const MYSTIC_DOT_TABLES: Record<string, string> = {
  "debuff-mystic-toad-poison": "toadPoisonDot",
  "debuff-mystic-combustion": "combustionDot",
  "debuff-mystic-smolder": "smolderDot",
  "debuff-mystic-flute-ripple": "fluteStrike",
  "debuff-mystic-toad-poison-fury": "toadPoisonFuryDot",
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function topRow(table: TierTable): HitRow {
  const top = table.rows["6"]!
  return [top.physMultiplier, top.attributeMultiplier, top.physFixed, top.attributeFixed]
}

export function healDot(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string" || !isRecord(debuff.dot)) return debuff
  const tableKey = MYSTIC_DOT_TABLES[debuff.id]
  const table = tableKey ? TIER_TABLES[tableKey] : undefined
  if (!table || debuff.dot.levelRows !== undefined || !matchesRow(debuff.dot, topRow(table)))
    return debuff
  return { ...debuff, dot: { ...debuff.dot, levelRows: structuredClone(table) } }
}

export const V26__mysticDotLevelRows: CustomDebuffMigration = {
  to: 26,
  name: "V26__mysticDotLevelRows",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs) ? blob.debuffs.map(healDot) : blob.debuffs
    return { ...blob, v: 26, debuffs }
  },
}
