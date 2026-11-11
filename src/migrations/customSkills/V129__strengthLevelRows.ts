// v128 → v129 — a Stonesplit Strength hit's row follows the martial-art level the
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
    from: [0.43723, 0.655845, 122, 66],
    rows: {
      "90": {
        physMultiplier: 0.43623,
        attributeMultiplier: 0.654345,
        physFixed: 89,
        attributeFixed: 50,
      },
      "95": {
        physMultiplier: 0.43673,
        attributeMultiplier: 0.655095,
        physFixed: 102,
        attributeFixed: 57,
      },
      "100": {
        physMultiplier: 0.43723,
        attributeMultiplier: 0.655845,
        physFixed: 122,
        attributeFixed: 66,
      },
    },
  },
  {
    from: [0.404708, 0.607062, 112, 61],
    rows: {
      "90": {
        physMultiplier: 0.404508,
        attributeMultiplier: 0.606762,
        physFixed: 81.4,
        attributeFixed: 46.4,
      },
      "95": {
        physMultiplier: 0.404608,
        attributeMultiplier: 0.606912,
        physFixed: 93.6,
        attributeFixed: 52.4,
      },
      "100": {
        physMultiplier: 0.404708,
        attributeMultiplier: 0.607062,
        physFixed: 112,
        attributeFixed: 61,
      },
    },
  },
  {
    from: [0.202354, 0.303531, 56, 30.5],
    rows: {
      "90": {
        physMultiplier: 0.202254,
        attributeMultiplier: 0.303381,
        physFixed: 40.7,
        attributeFixed: 23.2,
      },
      "95": {
        physMultiplier: 0.202304,
        attributeMultiplier: 0.303456,
        physFixed: 46.8,
        attributeFixed: 26.2,
      },
      "100": {
        physMultiplier: 0.202354,
        attributeMultiplier: 0.303531,
        physFixed: 56,
        attributeFixed: 30.5,
      },
    },
  },
  {
    from: [0.303531, 0.455297, 84, 45.75],
    rows: {
      "90": {
        physMultiplier: 0.303381,
        attributeMultiplier: 0.4550715,
        physFixed: 61.05,
        attributeFixed: 34.8,
      },
      "95": {
        physMultiplier: 0.303456,
        attributeMultiplier: 0.455184,
        physFixed: 70.2,
        attributeFixed: 39.3,
      },
      "100": {
        physMultiplier: 0.303531,
        attributeMultiplier: 0.4552965,
        physFixed: 84,
        attributeFixed: 45.75,
      },
    },
  },
  {
    from: [0.708239, 1.062359, 196, 106.75],
    rows: {
      "90": {
        physMultiplier: 0.707889,
        attributeMultiplier: 1.0618335,
        physFixed: 142.45,
        attributeFixed: 81.2,
      },
      "95": {
        physMultiplier: 0.708064,
        attributeMultiplier: 1.062096,
        physFixed: 163.8,
        attributeFixed: 91.7,
      },
      "100": {
        physMultiplier: 0.708239,
        attributeMultiplier: 1.0623585,
        physFixed: 196,
        attributeFixed: 106.75,
      },
    },
  },
  {
    from: [0.365684, 0.548525, 101.25, 55.2],
    rows: {
      "90": {
        physMultiplier: 0.3655335,
        attributeMultiplier: 0.54830025,
        physFixed: 73.65,
        attributeFixed: 41.85,
      },
      "95": {
        physMultiplier: 0.3656085,
        attributeMultiplier: 0.54841275,
        physFixed: 84.6,
        attributeFixed: 47.25,
      },
      "100": {
        physMultiplier: 0.3656835,
        attributeMultiplier: 0.54852525,
        physFixed: 101.25,
        attributeFixed: 55.2,
      },
    },
  },
  {
    from: [0.243789, 0.365684, 67.5, 36.8],
    rows: {
      "90": {
        physMultiplier: 0.243689,
        attributeMultiplier: 0.3655335,
        physFixed: 49.1,
        attributeFixed: 27.9,
      },
      "95": {
        physMultiplier: 0.243739,
        attributeMultiplier: 0.3656085,
        physFixed: 56.4,
        attributeFixed: 31.5,
      },
      "100": {
        physMultiplier: 0.243789,
        attributeMultiplier: 0.3656835,
        physFixed: 67.5,
        attributeFixed: 36.8,
      },
    },
  },
  {
    from: [0.292547, 0.43882, 81, 44.16],
    rows: {
      "90": {
        physMultiplier: 0.2924268,
        attributeMultiplier: 0.4386402,
        physFixed: 58.92,
        attributeFixed: 33.48,
      },
      "95": {
        physMultiplier: 0.2924868,
        attributeMultiplier: 0.4387302,
        physFixed: 67.68,
        attributeFixed: 37.8,
      },
      "100": {
        physMultiplier: 0.2925468,
        attributeMultiplier: 0.4388202,
        physFixed: 81,
        attributeFixed: 44.16,
      },
    },
  },
  {
    from: [0.560715, 0.841072, 155.25, 84.64],
    rows: {
      "90": {
        physMultiplier: 0.5604847,
        attributeMultiplier: 0.84072705,
        physFixed: 112.93,
        attributeFixed: 64.17,
      },
      "95": {
        physMultiplier: 0.5605997,
        attributeMultiplier: 0.84089955,
        physFixed: 129.72,
        attributeFixed: 72.45,
      },
      "100": {
        physMultiplier: 0.5607147,
        attributeMultiplier: 0.84107205,
        physFixed: 155.25,
        attributeFixed: 84.64,
      },
    },
  },
  {
    from: [1.42642, 2.13963, 395, 215],
    rows: {
      "90": {
        physMultiplier: 1.42542,
        attributeMultiplier: 2.13813,
        physFixed: 287,
        attributeFixed: 163,
      },
      "95": {
        physMultiplier: 1.42592,
        attributeMultiplier: 2.13888,
        physFixed: 330,
        attributeFixed: 184,
      },
      "100": {
        physMultiplier: 1.42642,
        attributeMultiplier: 2.13963,
        physFixed: 395,
        attributeFixed: 215,
      },
    },
  },
  {
    from: [1.01266, 1.51899, 281, 153],
    rows: {
      "90": {
        physMultiplier: 1.01166,
        attributeMultiplier: 1.51749,
        physFixed: 204,
        attributeFixed: 116,
      },
      "95": {
        physMultiplier: 1.01216,
        attributeMultiplier: 1.51824,
        physFixed: 235,
        attributeFixed: 131,
      },
      "100": {
        physMultiplier: 1.01266,
        attributeMultiplier: 1.51899,
        physFixed: 281,
        attributeFixed: 153,
      },
    },
  },
  {
    from: [0.763704, 1.145556, 211.2, 115.2],
    rows: {
      "90": {
        physMultiplier: 0.763504,
        attributeMultiplier: 1.145256,
        physFixed: 153.6,
        attributeFixed: 87.4,
      },
      "95": {
        physMultiplier: 0.763604,
        attributeMultiplier: 1.145406,
        physFixed: 176.4,
        attributeFixed: 98.6,
      },
      "100": {
        physMultiplier: 0.763704,
        attributeMultiplier: 1.145556,
        physFixed: 211.2,
        attributeFixed: 115.2,
      },
    },
  },
  {
    from: [0.95463, 1.431945, 264, 144],
    rows: {
      "90": {
        physMultiplier: 0.95438,
        attributeMultiplier: 1.43157,
        physFixed: 192,
        attributeFixed: 109.25,
      },
      "95": {
        physMultiplier: 0.954505,
        attributeMultiplier: 1.4317575,
        physFixed: 220.5,
        attributeFixed: 123.25,
      },
      "100": {
        physMultiplier: 0.95463,
        attributeMultiplier: 1.431945,
        physFixed: 264,
        attributeFixed: 144,
      },
    },
  },
  {
    from: [1.145556, 1.718334, 316.8, 172.8],
    rows: {
      "90": {
        physMultiplier: 1.145256,
        attributeMultiplier: 1.717884,
        physFixed: 230.4,
        attributeFixed: 131.1,
      },
      "95": {
        physMultiplier: 1.145406,
        attributeMultiplier: 1.718109,
        physFixed: 264.6,
        attributeFixed: 147.9,
      },
      "100": {
        physMultiplier: 1.145556,
        attributeMultiplier: 1.718334,
        physFixed: 316.8,
        attributeFixed: 172.8,
      },
    },
  },
  {
    from: [0.397233, 0.59585, 110.1, 60],
    rows: {
      "90": {
        physMultiplier: 0.396933,
        attributeMultiplier: 0.5953995,
        physFixed: 80.1,
        attributeFixed: 45.6,
      },
      "95": {
        physMultiplier: 0.397083,
        attributeMultiplier: 0.5956245,
        physFixed: 92.1,
        attributeFixed: 51.3,
      },
      "100": {
        physMultiplier: 0.397233,
        attributeMultiplier: 0.5958495,
        physFixed: 110.1,
        attributeFixed: 60,
      },
    },
  },
  {
    from: [0.926877, 1.390316, 256.9, 140],
    rows: {
      "90": {
        physMultiplier: 0.926177,
        attributeMultiplier: 1.3892655,
        physFixed: 186.9,
        attributeFixed: 106.4,
      },
      "95": {
        physMultiplier: 0.926527,
        attributeMultiplier: 1.3897905,
        physFixed: 214.9,
        attributeFixed: 119.7,
      },
      "100": {
        physMultiplier: 0.926877,
        attributeMultiplier: 1.3903155,
        physFixed: 256.9,
        attributeFixed: 140,
      },
    },
  },
  {
    from: [0.88272, 1.32408, 244.2, 133.2],
    rows: {
      "90": {
        physMultiplier: 0.88242,
        attributeMultiplier: 1.32363,
        physFixed: 177.6,
        attributeFixed: 101.1,
      },
      "95": {
        physMultiplier: 0.88257,
        attributeMultiplier: 1.323855,
        physFixed: 204,
        attributeFixed: 114,
      },
      "100": {
        physMultiplier: 0.88272,
        attributeMultiplier: 1.32408,
        physFixed: 244.2,
        attributeFixed: 133.2,
      },
    },
  },
  {
    from: [2.05968, 3.08952, 569.8, 310.8],
    rows: {
      "90": {
        physMultiplier: 2.05898,
        attributeMultiplier: 3.08847,
        physFixed: 414.4,
        attributeFixed: 235.9,
      },
      "95": {
        physMultiplier: 2.05933,
        attributeMultiplier: 3.088995,
        physFixed: 476,
        attributeFixed: 266,
      },
      "100": {
        physMultiplier: 2.05968,
        attributeMultiplier: 3.08952,
        physFixed: 569.8,
        attributeFixed: 310.8,
      },
    },
  },
  {
    from: [1.719879, 2.579819, 475.8, 259.2],
    rows: {
      "90": {
        physMultiplier: 1.719579,
        attributeMultiplier: 2.5793685,
        physFixed: 345.9,
        attributeFixed: 196.8,
      },
      "95": {
        physMultiplier: 1.719729,
        attributeMultiplier: 2.5795935,
        physFixed: 397.2,
        attributeFixed: 222.3,
      },
      "100": {
        physMultiplier: 1.719879,
        attributeMultiplier: 2.5798185,
        physFixed: 475.8,
        attributeFixed: 259.2,
      },
    },
  },
  {
    from: [4.013051, 6.019577, 1110.2, 604.8],
    rows: {
      "90": {
        physMultiplier: 4.012351,
        attributeMultiplier: 6.0185265,
        physFixed: 807.1,
        attributeFixed: 459.2,
      },
      "95": {
        physMultiplier: 4.012701,
        attributeMultiplier: 6.0190515,
        physFixed: 926.8,
        attributeFixed: 518.7,
      },
      "100": {
        physMultiplier: 4.013051,
        attributeMultiplier: 6.0195765,
        physFixed: 1110.2,
        attributeFixed: 604.8,
      },
    },
  },
  {
    from: [1.8948, 2.8422, 525, 286],
    rows: {
      "90": {
        physMultiplier: 1.8938,
        attributeMultiplier: 2.8407,
        physFixed: 382,
        attributeFixed: 217,
      },
      "95": {
        physMultiplier: 1.8943,
        attributeMultiplier: 2.84145,
        physFixed: 438,
        attributeFixed: 245,
      },
      "100": {
        physMultiplier: 1.8948,
        attributeMultiplier: 2.8422,
        physFixed: 525,
        attributeFixed: 286,
      },
    },
  },
  {
    from: [3.5256, 5.2884, 975, 532],
    rows: {
      "90": {
        physMultiplier: 3.5246,
        attributeMultiplier: 5.2869,
        physFixed: 709,
        attributeFixed: 403,
      },
      "95": {
        physMultiplier: 3.5251,
        attributeMultiplier: 5.28765,
        physFixed: 815,
        attributeFixed: 456,
      },
      "100": {
        physMultiplier: 3.5256,
        attributeMultiplier: 5.2884,
        physFixed: 975,
        attributeFixed: 532,
      },
    },
  },
  {
    from: [0.489916, 0.734874, 135.6, 73.8],
    rows: {
      "90": {
        physMultiplier: 0.489716,
        attributeMultiplier: 0.734574,
        physFixed: 98.6,
        attributeFixed: 56,
      },
      "95": {
        physMultiplier: 0.489816,
        attributeMultiplier: 0.734724,
        physFixed: 113.2,
        attributeFixed: 63.4,
      },
      "100": {
        physMultiplier: 0.489916,
        attributeMultiplier: 0.734874,
        physFixed: 135.6,
        attributeFixed: 73.8,
      },
    },
  },
  {
    from: [0.979832, 1.469748, 271.2, 147.6],
    rows: {
      "90": {
        physMultiplier: 0.979432,
        attributeMultiplier: 1.469148,
        physFixed: 197.2,
        attributeFixed: 112,
      },
      "95": {
        physMultiplier: 0.979632,
        attributeMultiplier: 1.469448,
        physFixed: 226.4,
        attributeFixed: 126.8,
      },
      "100": {
        physMultiplier: 0.979832,
        attributeMultiplier: 1.469748,
        physFixed: 271.2,
        attributeFixed: 147.6,
      },
    },
  },
  {
    from: [0.64861, 0.972915, 180, 98],
    rows: {
      "90": {
        physMultiplier: 0.64761,
        attributeMultiplier: 0.971415,
        physFixed: 131,
        attributeFixed: 74,
      },
      "95": {
        physMultiplier: 0.64811,
        attributeMultiplier: 0.972165,
        physFixed: 151,
        attributeFixed: 84,
      },
      "100": {
        physMultiplier: 0.64861,
        attributeMultiplier: 0.972915,
        physFixed: 180,
        attributeFixed: 98,
      },
    },
  },
  {
    from: [0.596352, 0.894528, 165.2, 90],
    rows: {
      "90": {
        physMultiplier: 0.595952,
        attributeMultiplier: 0.893928,
        physFixed: 120,
        attributeFixed: 68.4,
      },
      "95": {
        physMultiplier: 0.596152,
        attributeMultiplier: 0.894228,
        physFixed: 138,
        attributeFixed: 77.2,
      },
      "100": {
        physMultiplier: 0.596352,
        attributeMultiplier: 0.894528,
        physFixed: 165.2,
        attributeFixed: 90,
      },
    },
  },
  {
    from: [0.894528, 1.341792, 247.8, 135],
    rows: {
      "90": {
        physMultiplier: 0.893928,
        attributeMultiplier: 1.340892,
        physFixed: 180,
        attributeFixed: 102.6,
      },
      "95": {
        physMultiplier: 0.894228,
        attributeMultiplier: 1.341342,
        physFixed: 207,
        attributeFixed: 115.8,
      },
      "100": {
        physMultiplier: 0.894528,
        attributeMultiplier: 1.341792,
        physFixed: 247.8,
        attributeFixed: 135,
      },
    },
  },
  {
    from: [0.85296, 1.27944, 236, 128.8],
    rows: {
      "90": {
        physMultiplier: 0.85256,
        attributeMultiplier: 1.27884,
        physFixed: 171.6,
        attributeFixed: 97.6,
      },
      "95": {
        physMultiplier: 0.85276,
        attributeMultiplier: 1.27914,
        physFixed: 197.2,
        attributeFixed: 110.4,
      },
      "100": {
        physMultiplier: 0.85296,
        attributeMultiplier: 1.27944,
        physFixed: 236,
        attributeFixed: 128.8,
      },
    },
  },
  {
    from: [1.27944, 1.91916, 354, 193.2],
    rows: {
      "90": {
        physMultiplier: 1.27884,
        attributeMultiplier: 1.91826,
        physFixed: 257.4,
        attributeFixed: 146.4,
      },
      "95": {
        physMultiplier: 1.27914,
        attributeMultiplier: 1.91871,
        physFixed: 295.8,
        attributeFixed: 165.6,
      },
      "100": {
        physMultiplier: 1.27944,
        attributeMultiplier: 1.91916,
        physFixed: 354,
        attributeFixed: 193.2,
      },
    },
  },
  {
    from: [1.2338, 1.8507, 342, 186],
    rows: {
      "90": {
        physMultiplier: 1.2328,
        attributeMultiplier: 1.8492,
        physFixed: 249,
        attributeFixed: 141,
      },
      "95": {
        physMultiplier: 1.2333,
        attributeMultiplier: 1.84995,
        physFixed: 286,
        attributeFixed: 160,
      },
      "100": {
        physMultiplier: 1.2338,
        attributeMultiplier: 1.8507,
        physFixed: 342,
        attributeFixed: 186,
      },
    },
  },
  {
    from: [0.377968, 0.566952, 104.6, 57],
    rows: {
      "90": {
        physMultiplier: 0.377868,
        attributeMultiplier: 0.566802,
        physFixed: 76,
        attributeFixed: 43.2,
      },
      "95": {
        physMultiplier: 0.377918,
        attributeMultiplier: 0.566877,
        physFixed: 87.3,
        attributeFixed: 48.8,
      },
      "100": {
        physMultiplier: 0.377968,
        attributeMultiplier: 0.566952,
        physFixed: 104.6,
        attributeFixed: 57,
      },
    },
  },
  {
    from: [0.755936, 1.133904, 209.2, 114],
    rows: {
      "90": {
        physMultiplier: 0.755736,
        attributeMultiplier: 1.133604,
        physFixed: 152,
        attributeFixed: 86.4,
      },
      "95": {
        physMultiplier: 0.755836,
        attributeMultiplier: 1.133754,
        physFixed: 174.6,
        attributeFixed: 97.6,
      },
      "100": {
        physMultiplier: 0.755936,
        attributeMultiplier: 1.133904,
        physFixed: 209.2,
        attributeFixed: 114,
      },
    },
  },
  {
    from: [2.07686, 3.11529, 575, 313],
    rows: {
      "90": {
        physMultiplier: 2.07586,
        attributeMultiplier: 3.11379,
        physFixed: 418,
        attributeFixed: 238,
      },
      "95": {
        physMultiplier: 2.07636,
        attributeMultiplier: 3.11454,
        physFixed: 480,
        attributeFixed: 268,
      },
      "100": {
        physMultiplier: 2.07686,
        attributeMultiplier: 3.11529,
        physFixed: 575,
        attributeFixed: 313,
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
    !skill.id.startsWith("stonesplitStrength-")
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

export const V129__strengthLevelRows: CustomSkillMigration = {
  to: 129,
  name: "V129__strengthLevelRows",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 129, skills }
  },
}
