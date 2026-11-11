// v124 → v125 — a mystic art's hits read their row at the breakthrough's mystic
// tier. A Skill Editor copy seeded before this holds the single tier-6 row it
// was seeded with and ignores the breakthrough. Only a hit or variant still
// holding exactly that row gains the tier rows: once a value differs, a stale
// copy and a deliberate edit are indistinguishable.
import { matchesRow, type HitRow } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type TierRow = {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
}
type TierTable = { scale: "mysticTier"; rows: Record<string, TierRow> }

const TIER_TABLES: Record<string, TierTable> = {
  combustionExplosion: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 0.661667535751,
        attributeMultiplier: 0.992501303627,
        physFixed: 81.576,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 0.701728,
        attributeMultiplier: 1.052591,
        physFixed: 110.3386,
        attributeFixed: 0,
      },
    },
  },
  dragonFireSmolderFinisher: {
    scale: "mysticTier",
    rows: {
      "6": {
        physMultiplier: 1.41491,
        attributeMultiplier: 2.122364,
        physFixed: 225.8728,
        attributeFixed: 0,
      },
    },
  },
  dragonFireSmolderStrike: {
    scale: "mysticTier",
    rows: {
      "6": {
        physMultiplier: 1.283899,
        attributeMultiplier: 1.925849,
        physFixed: 204.9587,
        attributeFixed: 0,
      },
    },
  },
  dragonHead: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 17.990698,
        attributeMultiplier: 26.986047,
        physFixed: 2218.7,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 19.07564,
        attributeMultiplier: 28.61346,
        physFixed: 3001.372,
        attributeFixed: 0,
      },
    },
  },
  dragonHeadPlus: {
    scale: "mysticTier",
    rows: {
      "6": {
        physMultiplier: 12.597266,
        attributeMultiplier: 18.895899,
        physFixed: 1999.4721,
        attributeFixed: 0,
      },
    },
  },
  fireBreathFinisher: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 1.413585,
        attributeMultiplier: 2.1203775,
        physFixed: 174.42,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.49975,
        attributeMultiplier: 2.249625,
        physFixed: 237.2652,
        attributeFixed: 0,
      },
    },
  },
  fireBreathStrike: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 1.2826975,
        attributeMultiplier: 1.92404625,
        physFixed: 158.27,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.360884,
        attributeMultiplier: 2.041327,
        physFixed: 215.2962,
        attributeFixed: 0,
      },
    },
  },
  fluteFinisher: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 3.64549841282,
        attributeMultiplier: 5.46824761924,
        physFixed: 708.639792953,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 3.955457,
        attributeMultiplier: 5.933186,
        physFixed: 881.2783,
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
  freeMorphLarge: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 1.35215406563,
        attributeMultiplier: 2.02823109845,
        physFixed: 166.8,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.4342834,
        attributeMultiplier: 2.1514251,
        physFixed: 225.90800000000002,
        attributeFixed: 0,
      },
    },
  },
  freeMorphSmall: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 0.811292439378,
        attributeMultiplier: 1.21693865907,
        physFixed: 100.08,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 0.8605700399999999,
        attributeMultiplier: 1.29085506,
        physFixed: 135.54479999999998,
        attributeFixed: 0,
      },
    },
  },
  poetFinalHit: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 1.60821970495,
        attributeMultiplier: 2.41232955743,
        physFixed: 198.275,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.705588,
        attributeMultiplier: 2.558382,
        physFixed: 268.184,
        attributeFixed: 0,
      },
    },
  },
  poetStrike: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 0.964931822971,
        attributeMultiplier: 1.44739773446,
        physFixed: 118.965,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.023353,
        attributeMultiplier: 1.535029,
        physFixed: 160.9104,
        attributeFixed: 0,
      },
    },
  },
  smolderExplosion: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 1.5163214361,
        attributeMultiplier: 2.27448215415,
        physFixed: 186.945,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.608126,
        attributeMultiplier: 2.412189,
        physFixed: 252.8592,
        attributeFixed: 0,
      },
    },
  },
  soaringFirst: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 3.01348427461,
        attributeMultiplier: 4.52022641192,
        physFixed: 371.7,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 3.196543,
        attributeMultiplier: 4.794815,
        physFixed: 504.027,
        attributeFixed: 0,
      },
    },
  },
  soaringSecond: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 3.68314744675,
        attributeMultiplier: 5.52472117012,
        physFixed: 454.3,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 3.906886,
        attributeMultiplier: 5.860329,
        physFixed: 616.033,
        attributeFixed: 0,
      },
    },
  },
  toadFinisher: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 3.059256,
        attributeMultiplier: 4.588884,
        physFixed: 377.28,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 3.244011,
        attributeMultiplier: 4.866017,
        physFixed: 509.5968,
        attributeFixed: 0,
      },
    },
  },
  toadFuryFinisher: {
    scale: "mysticTier",
    rows: {
      "6": {
        physMultiplier: 3.060433,
        attributeMultiplier: 4.59065,
        physFixed: 484.9404,
        attributeFixed: 0,
      },
    },
  },
  toadFuryHitFinisher: {
    scale: "mysticTier",
    rows: {
      "6": {
        physMultiplier: 3.978563,
        attributeMultiplier: 5.967845,
        physFixed: 630.4225,
        attributeFixed: 0,
      },
    },
  },
  toadFuryStrike: {
    scale: "mysticTier",
    rows: {
      "6": {
        physMultiplier: 0.510072,
        attributeMultiplier: 0.765108,
        physFixed: 80.8234,
        attributeFixed: 0,
      },
    },
  },
  toadStrike: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 0.509876,
        attributeMultiplier: 0.764814,
        physFixed: 62.88,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 0.540669,
        attributeMultiplier: 0.811003,
        physFixed: 84.9328,
        attributeFixed: 0,
      },
    },
  },
  wolflikeFrenzyLarge: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 1.28237006563,
        attributeMultiplier: 1.92355509845,
        physFixed: 158.2,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.3603122,
        attributeMultiplier: 2.0404683,
        physFixed: 214.29200000000003,
        attributeFixed: 0,
      },
    },
  },
  wolflikeFrenzySmall: {
    scale: "mysticTier",
    rows: {
      "5": {
        physMultiplier: 0.961777549223,
        attributeMultiplier: 1.44266632383,
        physFixed: 118.65,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.02023415,
        attributeMultiplier: 1.530351225,
        physFixed: 160.719,
        attributeFixed: 0,
      },
    },
  },
}

interface HitSite {
  table?: string
  variants?: Record<string, string>
}

const MYSTIC_HIT_SITES: Record<string, readonly HitSite[]> = {
  "mystic-dragon-fire-smolder-1-hit": [
    {
      table: "dragonFireSmolderStrike",
      variants: { "Not Intoxicated": "dragonFireSmolderStrike" },
    },
    { table: "dragonFireSmolderStrike" },
    { table: "dragonFireSmolderFinisher" },
    {},
    {},
  ],
  "mystic-dragon-fire-smolder-2-hits": [
    {
      table: "dragonFireSmolderStrike",
      variants: { "Not Intoxicated": "dragonFireSmolderStrike" },
    },
    {
      table: "dragonFireSmolderStrike",
      variants: { "Not Intoxicated": "dragonFireSmolderStrike" },
    },
    {
      table: "dragonFireSmolderFinisher",
      variants: { "Not Intoxicated": "dragonFireSmolderFinisher" },
    },
    {},
  ],
  "mystic-dragon-head-plus": [{ table: "dragonHeadPlus" }],
  "mystic-dragon-head": [{ table: "dragonHead" }],
  "mystic-fire-breath-1-hit-prepull": [{ table: "fireBreathStrike" }],
  "mystic-fire-breath-1-hit": [
    { table: "fireBreathStrike", variants: { "Not Intoxicated": "fireBreathStrike" } },
    { table: "fireBreathStrike" },
    { table: "fireBreathFinisher" },
    {},
    {},
  ],
  "mystic-fire-breath-2-hit": [
    { table: "fireBreathStrike", variants: { "Not Intoxicated": "fireBreathStrike" } },
    { table: "fireBreathStrike", variants: { "Not Intoxicated": "fireBreathStrike" } },
    { table: "fireBreathFinisher", variants: { "Not Intoxicated": "fireBreathFinisher" } },
    {},
  ],
  "mystic-free-morph": [
    { table: "freeMorphLarge" },
    { table: "freeMorphSmall" },
    { table: "freeMorphSmall" },
    { table: "freeMorphSmall" },
    { table: "freeMorphSmall" },
    { table: "freeMorphSmall" },
    { table: "freeMorphLarge" },
  ],
  "mystic-flute-of-the-tides-cancel": [{}, { table: "fluteStrike" }],
  "mystic-flute-of-the-tides-full": [{ table: "fluteStrike" }, { table: "fluteFinisher" }],
  "mystic-poet-final-hit-cancel": [{ table: "poetFinalHit" }],
  "mystic-poet-final-hit-cancel-explosion": [
    { table: "combustionExplosion" },
    { table: "smolderExplosion" },
  ],
  "mystic-poet1": [{ table: "poetStrike" }, { table: "poetStrike" }],
  "mystic-poet2": [
    { table: "poetStrike" },
    { table: "poetStrike" },
    { table: "combustionExplosion" },
    { table: "smolderExplosion" },
    { table: "combustionExplosion" },
    { table: "smolderExplosion" },
  ],
  "mystic-poet3": [
    { table: "poetStrike" },
    { table: "poetStrike" },
    { table: "combustionExplosion" },
    { table: "smolderExplosion" },
    { table: "combustionExplosion" },
    { table: "smolderExplosion" },
  ],
  "mystic-poet4": [
    { table: "poetStrike" },
    { table: "poetStrike" },
    { table: "combustionExplosion" },
    { table: "smolderExplosion" },
    { table: "combustionExplosion" },
    { table: "smolderExplosion" },
  ],
  "mystic-soaring-1-hit": [{ table: "soaringFirst" }],
  "mystic-soaring": [{ table: "soaringFirst" }, { table: "soaringSecond" }],
  "mystic-toad-cancel": [{ table: "toadStrike" }, { table: "toadFinisher" }],
  "mystic-toad-fury": [{ table: "toadFuryStrike" }, { table: "toadFuryFinisher" }],
  "mystic-toad-fury-hit": [{ table: "toadFuryStrike" }, { table: "toadFuryHitFinisher" }],
  "mystic-wolflike-frenzy": [
    { table: "wolflikeFrenzyLarge" },
    { table: "wolflikeFrenzySmall" },
    { table: "wolflikeFrenzySmall" },
    { table: "wolflikeFrenzySmall" },
    { table: "wolflikeFrenzySmall" },
    { table: "wolflikeFrenzyLarge" },
  ],
}

type RowLike = Record<string, unknown>

const isRecord = (value: unknown): value is RowLike =>
  !!value && typeof value === "object" && !Array.isArray(value)

function topRow(table: TierTable): HitRow {
  const top = table.rows["6"]!
  return [top.physMultiplier, top.attributeMultiplier, top.physFixed, top.attributeFixed]
}

function withTable(row: RowLike, tableKey: string | undefined): RowLike {
  const table = tableKey ? TIER_TABLES[tableKey] : undefined
  if (!table || row.levelRows !== undefined || !matchesRow(row, topRow(table))) return row
  return { ...row, levelRows: structuredClone(table) }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const sites = MYSTIC_HIT_SITES[skill.id]
  if (!sites || !Array.isArray(skill.hits)) return skill
  const hits = skill.hits.map((hit: unknown, index: number) => {
    const site = sites[index]
    if (!site || !isRecord(hit)) return hit
    const healed = withTable(hit, site.table)
    if (!site.variants || !Array.isArray(hit.variants)) return healed
    const variants = hit.variants.map((variant: unknown) =>
      isRecord(variant) && typeof variant.label === "string"
        ? withTable(variant, site.variants![variant.label])
        : variant,
    )
    return { ...healed, variants }
  })
  return { ...skill, hits }
}

export const V125__mysticLevelRows: CustomSkillMigration = {
  to: 125,
  name: "V125__mysticLevelRows",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 125, skills }
  },
}
