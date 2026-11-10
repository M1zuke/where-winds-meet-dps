// v127 → v128 — a Bellstrike Splendor hit's row follows the martial-art level the
// breakthrough selects. A Skill Editor copy seeded before this holds the single
// level-100 row it was seeded with and ignores the breakthrough. Only a hit or
// variant still holding exactly that row gains the level rows: once a value
// differs, a stale copy and a deliberate edit are indistinguishable.
import { matchesRow, withRow, type HitRow } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type LevelRow = {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
}
type LevelTable = { from: HitRow; rows: Record<string, LevelRow> }

export const LEVEL_TABLES: readonly LevelTable[] = [
  {
    from: [0.591504, 0.887256, 164.4, 89.4],
    rows: {
      "90": {
        physMultiplier: 0.590904,
        attributeMultiplier: 0.886356,
        physFixed: 119.4,
        attributeFixed: 67.8,
      },
      "95": {
        physMultiplier: 0.591204,
        attributeMultiplier: 0.886806,
        physFixed: 136.8,
        attributeFixed: 76.8,
      },
      "100": {
        physMultiplier: 0.591504,
        attributeMultiplier: 0.887256,
        physFixed: 164.4,
        attributeFixed: 89.4,
      },
    },
  },
  {
    from: [0.91971, 1.379565, 255, 139],
    rows: {
      "90": {
        physMultiplier: 0.91871,
        attributeMultiplier: 1.378065,
        physFixed: 186,
        attributeFixed: 105,
      },
      "95": {
        physMultiplier: 0.91921,
        attributeMultiplier: 1.378815,
        physFixed: 213,
        attributeFixed: 119,
      },
      "100": {
        physMultiplier: 0.91971,
        attributeMultiplier: 1.379565,
        physFixed: 255,
        attributeFixed: 139,
      },
    },
  },
  {
    from: [0.483, 0.7245, 134, 73],
    rows: {
      "90": {
        physMultiplier: 0.4825,
        attributeMultiplier: 0.72375,
        physFixed: 97.5,
        attributeFixed: 55.5,
      },
      "95": {
        physMultiplier: 0.48275,
        attributeMultiplier: 0.724125,
        physFixed: 112,
        attributeFixed: 62.5,
      },
      "100": {
        physMultiplier: 0.483,
        attributeMultiplier: 0.7245,
        physFixed: 134,
        attributeFixed: 73,
      },
    },
  },
  {
    from: [0.3287865, 0.49317975, 91.05, 49.65],
    rows: {
      "90": {
        physMultiplier: 0.3286365,
        attributeMultiplier: 0.49295475,
        physFixed: 66.15,
        attributeFixed: 37.65,
      },
      "95": {
        physMultiplier: 0.3287115,
        attributeMultiplier: 0.49306725,
        physFixed: 76.05,
        attributeFixed: 42.45,
      },
      "100": {
        physMultiplier: 0.3287865,
        attributeMultiplier: 0.49317975,
        physFixed: 91.05,
        attributeFixed: 49.65,
      },
    },
  },
  {
    from: [0.219191, 0.3287865, 60.7, 33.1],
    rows: {
      "90": {
        physMultiplier: 0.219091,
        attributeMultiplier: 0.3286365,
        physFixed: 44.1,
        attributeFixed: 25.1,
      },
      "95": {
        physMultiplier: 0.219141,
        attributeMultiplier: 0.3287115,
        physFixed: 50.7,
        attributeFixed: 28.3,
      },
      "100": {
        physMultiplier: 0.219191,
        attributeMultiplier: 0.3287865,
        physFixed: 60.7,
        attributeFixed: 33.1,
      },
    },
  },
  {
    from: [0.5479775, 0.82196625, 151.75, 82.75],
    rows: {
      "90": {
        physMultiplier: 0.5477275,
        attributeMultiplier: 0.82159125,
        physFixed: 110.25,
        attributeFixed: 62.75,
      },
      "95": {
        physMultiplier: 0.5478525,
        attributeMultiplier: 0.82177875,
        physFixed: 126.75,
        attributeFixed: 70.75,
      },
      "100": {
        physMultiplier: 0.5479775,
        attributeMultiplier: 0.82196625,
        physFixed: 151.75,
        attributeFixed: 82.75,
      },
    },
  },
  {
    from: [0.57317, 0.859755, 160, 87],
    rows: {
      "90": {
        physMultiplier: 0.57217,
        attributeMultiplier: 0.858255,
        physFixed: 116,
        attributeFixed: 66,
      },
      "95": {
        physMultiplier: 0.57267,
        attributeMultiplier: 0.859005,
        physFixed: 133,
        attributeFixed: 74,
      },
      "100": {
        physMultiplier: 0.57317,
        attributeMultiplier: 0.859755,
        physFixed: 160,
        attributeFixed: 87,
      },
    },
  },
  {
    from: [0.2504125, 0.37561875, 69.375, 37.75],
    rows: {
      "90": {
        physMultiplier: 0.2502875,
        attributeMultiplier: 0.37543125,
        physFixed: 50.375,
        attributeFixed: 28.625,
      },
      "95": {
        physMultiplier: 0.25035,
        attributeMultiplier: 0.375525,
        physFixed: 57.875,
        attributeFixed: 32.375,
      },
      "100": {
        physMultiplier: 0.2504125,
        attributeMultiplier: 0.37561875,
        physFixed: 69.375,
        attributeFixed: 37.75,
      },
    },
  },
  {
    from: [0.20033, 0.300495, 55.5, 30.2],
    rows: {
      "90": {
        physMultiplier: 0.20023,
        attributeMultiplier: 0.300345,
        physFixed: 40.3,
        attributeFixed: 22.9,
      },
      "95": {
        physMultiplier: 0.20028,
        attributeMultiplier: 0.30042,
        physFixed: 46.3,
        attributeFixed: 25.9,
      },
      "100": {
        physMultiplier: 0.20033,
        attributeMultiplier: 0.300495,
        physFixed: 55.5,
        attributeFixed: 30.2,
      },
    },
  },
  {
    from: [0.40066, 0.60099, 111, 60.4],
    rows: {
      "90": {
        physMultiplier: 0.40046,
        attributeMultiplier: 0.60069,
        physFixed: 80.6,
        attributeFixed: 45.8,
      },
      "95": {
        physMultiplier: 0.40056,
        attributeMultiplier: 0.60084,
        physFixed: 92.6,
        attributeFixed: 51.8,
      },
      "100": {
        physMultiplier: 0.40066,
        attributeMultiplier: 0.60099,
        physFixed: 111,
        attributeFixed: 60.4,
      },
    },
  },
  {
    from: [0.1126455, 0.16896825, 31.141, 16.973],
    rows: {
      "90": {
        physMultiplier: 0.1126345,
        attributeMultiplier: 0.16895175,
        physFixed: 22.649,
        attributeFixed: 12.881,
      },
      "95": {
        physMultiplier: 0.11264,
        attributeMultiplier: 0.16896,
        physFixed: 26.015,
        attributeFixed: 14.553,
      },
      "100": {
        physMultiplier: 0.1126455,
        attributeMultiplier: 0.16896825,
        physFixed: 31.141,
        attributeFixed: 16.973,
      },
    },
  },
  {
    from: [1.02405, 1.536075, 283.1, 154.3],
    rows: {
      "90": {
        physMultiplier: 1.02395,
        attributeMultiplier: 1.535925,
        physFixed: 205.9,
        attributeFixed: 117.1,
      },
      "95": {
        physMultiplier: 1.024,
        attributeMultiplier: 1.536,
        physFixed: 236.5,
        attributeFixed: 132.3,
      },
      "100": {
        physMultiplier: 1.02405,
        attributeMultiplier: 1.536075,
        physFixed: 283.1,
        attributeFixed: 154.3,
      },
    },
  },
  {
    from: [2.0481, 3.07215, 566.2, 308.6],
    rows: {
      "90": {
        physMultiplier: 2.0479,
        attributeMultiplier: 3.07185,
        physFixed: 411.8,
        attributeFixed: 234.2,
      },
      "95": {
        physMultiplier: 2.048,
        attributeMultiplier: 3.072,
        physFixed: 473,
        attributeFixed: 264.6,
      },
      "100": {
        physMultiplier: 2.0481,
        attributeMultiplier: 3.07215,
        physFixed: 566.2,
        attributeFixed: 308.6,
      },
    },
  },
  {
    from: [0.46416, 0.69624, 128.8, 70],
    rows: {
      "90": {
        physMultiplier: 0.46376,
        attributeMultiplier: 0.69564,
        physFixed: 93.6,
        attributeFixed: 53.2,
      },
      "95": {
        physMultiplier: 0.46396,
        attributeMultiplier: 0.69594,
        physFixed: 107.6,
        attributeFixed: 60,
      },
      "100": {
        physMultiplier: 0.46416,
        attributeMultiplier: 0.69624,
        physFixed: 128.8,
        attributeFixed: 70,
      },
    },
  },
  {
    from: [0.69624, 1.04436, 193.2, 105],
    rows: {
      "90": {
        physMultiplier: 0.69564,
        attributeMultiplier: 1.04346,
        physFixed: 140.4,
        attributeFixed: 79.8,
      },
      "95": {
        physMultiplier: 0.69594,
        attributeMultiplier: 1.04391,
        physFixed: 161.4,
        attributeFixed: 90,
      },
      "100": {
        physMultiplier: 0.69624,
        attributeMultiplier: 1.04436,
        physFixed: 193.2,
        attributeFixed: 105,
      },
    },
  },
  {
    from: [0.479274, 0.718911, 132.6, 72.2],
    rows: {
      "90": {
        physMultiplier: 0.479074,
        attributeMultiplier: 0.718611,
        physFixed: 96.4,
        attributeFixed: 54.8,
      },
      "95": {
        physMultiplier: 0.479174,
        attributeMultiplier: 0.718761,
        physFixed: 110.8,
        attributeFixed: 62,
      },
      "100": {
        physMultiplier: 0.479274,
        attributeMultiplier: 0.718911,
        physFixed: 132.6,
        attributeFixed: 72.2,
      },
    },
  },
  {
    from: [0.3594555, 0.53918325, 99.45, 54.15],
    rows: {
      "90": {
        physMultiplier: 0.3593055,
        attributeMultiplier: 0.53895825,
        physFixed: 72.3,
        attributeFixed: 41.1,
      },
      "95": {
        physMultiplier: 0.3593805,
        attributeMultiplier: 0.53907075,
        physFixed: 83.1,
        attributeFixed: 46.5,
      },
      "100": {
        physMultiplier: 0.3594555,
        attributeMultiplier: 0.53918325,
        physFixed: 99.45,
        attributeFixed: 54.15,
      },
    },
  },
  {
    from: [0.718911, 1.0783665, 198.9, 108.3],
    rows: {
      "90": {
        physMultiplier: 0.718611,
        attributeMultiplier: 1.0779165,
        physFixed: 144.6,
        attributeFixed: 82.2,
      },
      "95": {
        physMultiplier: 0.718761,
        attributeMultiplier: 1.0781415,
        physFixed: 166.2,
        attributeFixed: 93,
      },
      "100": {
        physMultiplier: 0.718911,
        attributeMultiplier: 1.0783665,
        physFixed: 198.9,
        attributeFixed: 108.3,
      },
    },
  },
  {
    from: [3.2664, 4.8996, 904, 493],
    rows: {
      "90": {
        physMultiplier: 3.2654,
        attributeMultiplier: 4.8981,
        physFixed: 657,
        attributeFixed: 374,
      },
      "95": {
        physMultiplier: 3.2659,
        attributeMultiplier: 4.89885,
        physFixed: 755,
        attributeFixed: 422,
      },
      "100": {
        physMultiplier: 3.2664,
        attributeMultiplier: 4.8996,
        physFixed: 904,
        attributeFixed: 493,
      },
    },
  },
  {
    from: [1.30656, 1.95984, 361.6, 197.2],
    rows: {
      "90": {
        physMultiplier: 1.30616,
        attributeMultiplier: 1.95924,
        physFixed: 262.8,
        attributeFixed: 149.6,
      },
      "95": {
        physMultiplier: 1.30636,
        attributeMultiplier: 1.95954,
        physFixed: 302,
        attributeFixed: 168.8,
      },
      "100": {
        physMultiplier: 1.30656,
        attributeMultiplier: 1.95984,
        physFixed: 361.6,
        attributeFixed: 197.2,
      },
    },
  },
  {
    from: [1.567872, 2.351808, 433.92, 236.64],
    rows: {
      "90": {
        physMultiplier: 1.567392,
        attributeMultiplier: 2.351088,
        physFixed: 315.36,
        attributeFixed: 179.52,
      },
      "95": {
        physMultiplier: 1.567632,
        attributeMultiplier: 2.351448,
        physFixed: 362.4,
        attributeFixed: 202.56,
      },
      "100": {
        physMultiplier: 1.567872,
        attributeMultiplier: 2.351808,
        physFixed: 433.92,
        attributeFixed: 236.64,
      },
    },
  },
  {
    from: [1.829184, 2.743776, 506.24, 276.08],
    rows: {
      "90": {
        physMultiplier: 1.828624,
        attributeMultiplier: 2.742936,
        physFixed: 367.92,
        attributeFixed: 209.44,
      },
      "95": {
        physMultiplier: 1.828904,
        attributeMultiplier: 2.743356,
        physFixed: 422.8,
        attributeFixed: 236.32,
      },
      "100": {
        physMultiplier: 1.829184,
        attributeMultiplier: 2.743776,
        physFixed: 506.24,
        attributeFixed: 276.08,
      },
    },
  },
  {
    from: [1.51032, 2.26548, 419, 228],
    rows: {
      "90": {
        physMultiplier: 1.50932,
        attributeMultiplier: 2.26398,
        physFixed: 304,
        attributeFixed: 173,
      },
      "95": {
        physMultiplier: 1.50982,
        attributeMultiplier: 2.26473,
        physFixed: 349,
        attributeFixed: 195,
      },
      "100": {
        physMultiplier: 1.51032,
        attributeMultiplier: 2.26548,
        physFixed: 419,
        attributeFixed: 228,
      },
    },
  },
  {
    from: [0.26903, 0.403545, 74.5, 40.625],
    rows: {
      "90": {
        physMultiplier: 0.268905,
        attributeMultiplier: 0.4033575,
        physFixed: 54.125,
        attributeFixed: 30.75,
      },
      "95": {
        physMultiplier: 0.2689675,
        attributeMultiplier: 0.40345125,
        physFixed: 62.25,
        attributeFixed: 34.75,
      },
      "100": {
        physMultiplier: 0.26903,
        attributeMultiplier: 0.403545,
        physFixed: 74.5,
        attributeFixed: 40.625,
      },
    },
  },
  {
    from: [0.322836, 0.484254, 89.4, 48.75],
    rows: {
      "90": {
        physMultiplier: 0.322686,
        attributeMultiplier: 0.484029,
        physFixed: 64.95,
        attributeFixed: 36.9,
      },
      "95": {
        physMultiplier: 0.322761,
        attributeMultiplier: 0.4841415,
        physFixed: 74.7,
        attributeFixed: 41.7,
      },
      "100": {
        physMultiplier: 0.322836,
        attributeMultiplier: 0.484254,
        physFixed: 89.4,
        attributeFixed: 48.75,
      },
    },
  },
  {
    from: [0.161418, 0.242127, 44.7, 24.375],
    rows: {
      "90": {
        physMultiplier: 0.161343,
        attributeMultiplier: 0.2420145,
        physFixed: 32.475,
        attributeFixed: 18.45,
      },
      "95": {
        physMultiplier: 0.1613805,
        attributeMultiplier: 0.24207075,
        physFixed: 37.35,
        attributeFixed: 20.85,
      },
      "100": {
        physMultiplier: 0.161418,
        attributeMultiplier: 0.242127,
        physFixed: 44.7,
        attributeFixed: 24.375,
      },
    },
  },
  {
    from: [0.645672, 0.968508, 178.8, 97.5],
    rows: {
      "90": {
        physMultiplier: 0.645372,
        attributeMultiplier: 0.968058,
        physFixed: 129.9,
        attributeFixed: 73.8,
      },
      "95": {
        physMultiplier: 0.645522,
        attributeMultiplier: 0.968283,
        physFixed: 149.4,
        attributeFixed: 83.4,
      },
      "100": {
        physMultiplier: 0.645672,
        attributeMultiplier: 0.968508,
        physFixed: 178.8,
        attributeFixed: 97.5,
      },
    },
  },
  {
    from: [0.7689855, 1.15347825, 212.7, 115.95],
    rows: {
      "90": {
        physMultiplier: 0.7688355,
        attributeMultiplier: 1.15325325,
        physFixed: 154.65,
        attributeFixed: 87.9,
      },
      "95": {
        physMultiplier: 0.7689105,
        attributeMultiplier: 1.15336575,
        physFixed: 177.6,
        attributeFixed: 99.3,
      },
      "100": {
        physMultiplier: 0.7689855,
        attributeMultiplier: 1.15347825,
        physFixed: 212.7,
        attributeFixed: 115.95,
      },
    },
  },
  {
    from: [1.025314, 1.537971, 283.6, 154.6],
    rows: {
      "90": {
        physMultiplier: 1.025114,
        attributeMultiplier: 1.537671,
        physFixed: 206.2,
        attributeFixed: 117.2,
      },
      "95": {
        physMultiplier: 1.025214,
        attributeMultiplier: 1.537821,
        physFixed: 236.8,
        attributeFixed: 132.4,
      },
      "100": {
        physMultiplier: 1.025314,
        attributeMultiplier: 1.537971,
        physFixed: 283.6,
        attributeFixed: 154.6,
      },
    },
  },
  {
    from: [0.868016, 1.302024, 240.8, 131.2],
    rows: {
      "90": {
        physMultiplier: 0.867216,
        attributeMultiplier: 1.300824,
        physFixed: 175.2,
        attributeFixed: 99.2,
      },
      "95": {
        physMultiplier: 0.867616,
        attributeMultiplier: 1.301424,
        physFixed: 200.8,
        attributeFixed: 112,
      },
      "100": {
        physMultiplier: 0.868016,
        attributeMultiplier: 1.302024,
        physFixed: 240.8,
        attributeFixed: 131.2,
      },
    },
  },
  {
    from: [1.76747, 2.651205, 490, 267],
    rows: {
      "90": {
        physMultiplier: 1.76647,
        attributeMultiplier: 2.649705,
        physFixed: 356,
        attributeFixed: 202,
      },
      "95": {
        physMultiplier: 1.76697,
        attributeMultiplier: 2.650455,
        physFixed: 409,
        attributeFixed: 228,
      },
      "100": {
        physMultiplier: 1.76747,
        attributeMultiplier: 2.651205,
        physFixed: 490,
        attributeFixed: 267,
      },
    },
  },
  {
    from: [0.173364, 0.260046, 48.2, 26.2],
    rows: {
      "90": {
        physMultiplier: 0.173164,
        attributeMultiplier: 0.259746,
        physFixed: 35,
        attributeFixed: 19.8,
      },
      "95": {
        physMultiplier: 0.173264,
        attributeMultiplier: 0.259896,
        physFixed: 40.2,
        attributeFixed: 22.4,
      },
      "100": {
        physMultiplier: 0.173364,
        attributeMultiplier: 0.260046,
        physFixed: 48.2,
        attributeFixed: 26.2,
      },
    },
  },
  {
    from: [0.693456, 1.040184, 192.8, 104.8],
    rows: {
      "90": {
        physMultiplier: 0.692656,
        attributeMultiplier: 1.038984,
        physFixed: 140,
        attributeFixed: 79.2,
      },
      "95": {
        physMultiplier: 0.693056,
        attributeMultiplier: 1.039584,
        physFixed: 160.8,
        attributeFixed: 89.6,
      },
      "100": {
        physMultiplier: 0.693456,
        attributeMultiplier: 1.040184,
        physFixed: 192.8,
        attributeFixed: 104.8,
      },
    },
  },
]

type RowLike = Record<string, unknown>

const isRecord = (value: unknown): value is RowLike =>
  !!value && typeof value === "object" && !Array.isArray(value)

function withLevelRows(row: RowLike): RowLike {
  if (row.levelRows !== undefined) return row
  const table = LEVEL_TABLES.find((candidate) => matchesRow(row, candidate.from))
  if (!table) return row
  const top = table.rows["100"]!
  return {
    ...withRow(row, [
      top.physMultiplier,
      top.attributeMultiplier,
      top.physFixed,
      top.attributeFixed,
    ]),
    levelRows: { scale: "artLevel", rows: structuredClone(table.rows) },
  }
}

export function healSkill(skill: unknown): unknown {
  if (
    !isRecord(skill) ||
    typeof skill.id !== "string" ||
    !skill.id.startsWith("bellstrikeSplendor-")
  )
    return skill
  if (!Array.isArray(skill.hits)) return skill
  const hits = skill.hits.map((hit: unknown) => {
    if (!isRecord(hit)) return hit
    const healed = withLevelRows(hit)
    if (!Array.isArray(hit.variants)) return healed
    const variants = hit.variants.map((variant: unknown) =>
      isRecord(variant) ? withLevelRows(variant) : variant,
    )
    return { ...healed, variants }
  })
  return { ...skill, hits }
}

export const V128__splendorLevelRows: CustomSkillMigration = {
  to: 128,
  name: "V128__splendorLevelRows",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 128, skills }
  },
}
