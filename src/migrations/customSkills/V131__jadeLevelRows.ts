// v130 → v131 — a Silkbind Jade hit's row follows the martial-art level the
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
    from: [2.504152, 3.756228, 692.8, 377.6],
    rows: {
      "90": {
        physMultiplier: 2.503352,
        attributeMultiplier: 3.755028,
        physFixed: 504,
        attributeFixed: 286.4,
      },
      "95": {
        physMultiplier: 2.503752,
        attributeMultiplier: 3.755628,
        physFixed: 578.4,
        attributeFixed: 323.2,
      },
      "100": {
        physMultiplier: 2.504152,
        attributeMultiplier: 3.756228,
        physFixed: 692.8,
        attributeFixed: 377.6,
      },
    },
  },
  {
    from: [1.565095, 2.347643, 433, 236],
    rows: {
      "90": {
        physMultiplier: 1.564595,
        attributeMultiplier: 2.3468925,
        physFixed: 315,
        attributeFixed: 179,
      },
      "95": {
        physMultiplier: 1.564845,
        attributeMultiplier: 2.3472675,
        physFixed: 361.5,
        attributeFixed: 202,
      },
      "100": {
        physMultiplier: 1.565095,
        attributeMultiplier: 2.3476425,
        physFixed: 433,
        attributeFixed: 236,
      },
    },
  },
  {
    from: [0.626038, 0.939057, 173.2, 94.4],
    rows: {
      "90": {
        physMultiplier: 0.625838,
        attributeMultiplier: 0.938757,
        physFixed: 126,
        attributeFixed: 71.6,
      },
      "95": {
        physMultiplier: 0.625938,
        attributeMultiplier: 0.938907,
        physFixed: 144.6,
        attributeFixed: 80.8,
      },
      "100": {
        physMultiplier: 0.626038,
        attributeMultiplier: 0.939057,
        physFixed: 173.2,
        attributeFixed: 94.4,
      },
    },
  },
  {
    from: [0.49758, 0.74637, 138, 75],
    rows: {
      "90": {
        physMultiplier: 0.49708,
        attributeMultiplier: 0.74562,
        physFixed: 100.5,
        attributeFixed: 57,
      },
      "95": {
        physMultiplier: 0.49733,
        attributeMultiplier: 0.745995,
        physFixed: 115.5,
        attributeFixed: 64.5,
      },
      "100": {
        physMultiplier: 0.49758,
        attributeMultiplier: 0.74637,
        physFixed: 138,
        attributeFixed: 75,
      },
    },
  },
  {
    from: [0.301464, 0.452196, 83.7, 45.6],
    rows: {
      "90": {
        physMultiplier: 0.301164,
        attributeMultiplier: 0.451746,
        physFixed: 60.9,
        attributeFixed: 34.5,
      },
      "95": {
        physMultiplier: 0.301314,
        attributeMultiplier: 0.451971,
        physFixed: 69.9,
        attributeFixed: 39,
      },
      "100": {
        physMultiplier: 0.301464,
        attributeMultiplier: 0.452196,
        physFixed: 83.7,
        attributeFixed: 45.6,
      },
    },
  },
  {
    from: [0.401952, 0.602928, 111.6, 60.8],
    rows: {
      "90": {
        physMultiplier: 0.401552,
        attributeMultiplier: 0.602328,
        physFixed: 81.2,
        attributeFixed: 46,
      },
      "95": {
        physMultiplier: 0.401752,
        attributeMultiplier: 0.602628,
        physFixed: 93.2,
        attributeFixed: 52,
      },
      "100": {
        physMultiplier: 0.401952,
        attributeMultiplier: 0.602928,
        physFixed: 111.6,
        attributeFixed: 60.8,
      },
    },
  },
  {
    from: [0.54132, 0.81198, 150, 82],
    rows: {
      "90": {
        physMultiplier: 0.54082,
        attributeMultiplier: 0.81123,
        physFixed: 109,
        attributeFixed: 62,
      },
      "95": {
        physMultiplier: 0.54107,
        attributeMultiplier: 0.811605,
        physFixed: 125.5,
        attributeFixed: 70,
      },
      "100": {
        physMultiplier: 0.54132,
        attributeMultiplier: 0.81198,
        physFixed: 150,
        attributeFixed: 82,
      },
    },
  },
  {
    from: [0.37434, 0.56148, 103.8, 56.4],
    rows: {
      "90": {
        physMultiplier: 0.374028,
        attributeMultiplier: 0.561042,
        physFixed: 75.3,
        attributeFixed: 42.9,
      },
      "95": {
        physMultiplier: 0.374178,
        attributeMultiplier: 0.561267,
        physFixed: 86.7,
        attributeFixed: 48.3,
      },
      "100": {
        physMultiplier: 0.374328,
        attributeMultiplier: 0.561492,
        physFixed: 103.8,
        attributeFixed: 56.4,
      },
    },
  },
  {
    from: [0.49912, 0.74864, 138.4, 75.2],
    rows: {
      "90": {
        physMultiplier: 0.498704,
        attributeMultiplier: 0.748056,
        physFixed: 100.4,
        attributeFixed: 57.2,
      },
      "95": {
        physMultiplier: 0.498904,
        attributeMultiplier: 0.748356,
        physFixed: 115.6,
        attributeFixed: 64.4,
      },
      "100": {
        physMultiplier: 0.499104,
        attributeMultiplier: 0.748656,
        physFixed: 138.4,
        attributeFixed: 75.2,
      },
    },
  },
  {
    from: [0.5282374999999999, 0.792365, 146.125, 79.625],
    rows: {
      "90": {
        physMultiplier: 0.5280695,
        attributeMultiplier: 0.79210425,
        physFixed: 106.225,
        attributeFixed: 60.375,
      },
      "95": {
        physMultiplier: 0.528157,
        attributeMultiplier: 0.7922355,
        physFixed: 122.15,
        attributeFixed: 68.25,
      },
      "100": {
        physMultiplier: 0.5282445,
        attributeMultiplier: 0.79236675,
        physFixed: 146.125,
        attributeFixed: 79.625,
      },
    },
  },
  {
    from: [0.90555, 1.3583399999999999, 250.5, 136.5],
    rows: {
      "90": {
        physMultiplier: 0.905262,
        attributeMultiplier: 1.357893,
        physFixed: 182.1,
        attributeFixed: 103.5,
      },
      "95": {
        physMultiplier: 0.905412,
        attributeMultiplier: 1.358118,
        physFixed: 209.4,
        attributeFixed: 117,
      },
      "100": {
        physMultiplier: 0.905562,
        attributeMultiplier: 1.358343,
        physFixed: 250.5,
        attributeFixed: 136.5,
      },
    },
  },
  {
    from: [0.306048, 0.459072, 84.75, 46.2],
    rows: {
      "90": {
        physMultiplier: 0.305898,
        attributeMultiplier: 0.458847,
        physFixed: 61.65,
        attributeFixed: 35.1,
      },
      "95": {
        physMultiplier: 0.305973,
        attributeMultiplier: 0.4589595,
        physFixed: 70.8,
        attributeFixed: 39.6,
      },
      "100": {
        physMultiplier: 0.306048,
        attributeMultiplier: 0.459072,
        physFixed: 84.75,
        attributeFixed: 46.2,
      },
    },
  },
  {
    from: [0.918144, 1.377216, 254.25, 138.6],
    rows: {
      "90": {
        physMultiplier: 0.917694,
        attributeMultiplier: 1.376541,
        physFixed: 184.95,
        attributeFixed: 105.3,
      },
      "95": {
        physMultiplier: 0.917919,
        attributeMultiplier: 1.3768785,
        physFixed: 212.4,
        attributeFixed: 118.8,
      },
      "100": {
        physMultiplier: 0.918144,
        attributeMultiplier: 1.377216,
        physFixed: 254.25,
        attributeFixed: 138.6,
      },
    },
  },
  {
    from: [1.9044, 2.8566, 527, 287],
    rows: {
      "90": {
        physMultiplier: 1.9034,
        attributeMultiplier: 2.8551,
        physFixed: 383,
        attributeFixed: 218,
      },
      "95": {
        physMultiplier: 1.9039,
        attributeMultiplier: 2.85585,
        physFixed: 440,
        attributeFixed: 246,
      },
      "100": {
        physMultiplier: 1.9044,
        attributeMultiplier: 2.8566,
        physFixed: 527,
        attributeFixed: 287,
      },
    },
  },
  {
    from: [0.408064, 0.612096, 113, 61.6],
    rows: {
      "90": {
        physMultiplier: 0.407864,
        attributeMultiplier: 0.611796,
        physFixed: 82.2,
        attributeFixed: 46.8,
      },
      "95": {
        physMultiplier: 0.407964,
        attributeMultiplier: 0.611946,
        physFixed: 94.4,
        attributeFixed: 52.8,
      },
      "100": {
        physMultiplier: 0.408064,
        attributeMultiplier: 0.612096,
        physFixed: 113,
        attributeFixed: 61.6,
      },
    },
  },
  {
    from: [0.9271, 1.3907, 257, 140],
    rows: {
      "90": {
        physMultiplier: 0.92612,
        attributeMultiplier: 1.38918,
        physFixed: 187,
        attributeFixed: 106,
      },
      "95": {
        physMultiplier: 0.92662,
        attributeMultiplier: 1.38993,
        physFixed: 215,
        attributeFixed: 120,
      },
      "100": {
        physMultiplier: 0.92712,
        attributeMultiplier: 1.39068,
        physFixed: 257,
        attributeFixed: 140,
      },
    },
  },
  {
    from: [1.273401, 1.9101015, 353.225, 192.035],
    rows: {
      "90": {
        physMultiplier: 1.272406,
        attributeMultiplier: 1.908609,
        physFixed: 256.71,
        attributeFixed: 146.265,
      },
      "95": {
        physMultiplier: 1.2729035,
        attributeMultiplier: 1.90935525,
        physFixed: 294.52,
        attributeFixed: 165.17,
      },
      "100": {
        physMultiplier: 1.273401,
        attributeMultiplier: 1.9101015,
        physFixed: 353.225,
        attributeFixed: 192.035,
      },
    },
  },
  {
    from: [0.612395, 0.918593, 169.5, 92.25],
    rows: {
      "90": {
        physMultiplier: 0.612145,
        attributeMultiplier: 0.9182175,
        physFixed: 123.25,
        attributeFixed: 70,
      },
      "95": {
        physMultiplier: 0.61227,
        attributeMultiplier: 0.918405,
        physFixed: 141.5,
        attributeFixed: 79.25,
      },
      "100": {
        physMultiplier: 0.612395,
        attributeMultiplier: 0.9185925,
        physFixed: 169.5,
        attributeFixed: 92.25,
      },
    },
  },
  {
    from: [1.22479, 1.837185, 339, 184.5],
    rows: {
      "90": {
        physMultiplier: 1.22429,
        attributeMultiplier: 1.836435,
        physFixed: 246.5,
        attributeFixed: 140,
      },
      "95": {
        physMultiplier: 1.22454,
        attributeMultiplier: 1.83681,
        physFixed: 283,
        attributeFixed: 158.5,
      },
      "100": {
        physMultiplier: 1.22479,
        attributeMultiplier: 1.837185,
        physFixed: 339,
        attributeFixed: 184.5,
      },
    },
  },
  {
    from: [0.913968, 1.370952, 253.2, 138],
    rows: {
      "90": {
        physMultiplier: 0.913368,
        attributeMultiplier: 1.370052,
        physFixed: 184.2,
        attributeFixed: 104.4,
      },
      "95": {
        physMultiplier: 0.913668,
        attributeMultiplier: 1.370502,
        physFixed: 211.2,
        attributeFixed: 118.2,
      },
      "100": {
        physMultiplier: 0.913968,
        attributeMultiplier: 1.370952,
        physFixed: 253.2,
        attributeFixed: 138,
      },
    },
  },
  {
    from: [0.19041, 0.285615, 52.75, 28.75],
    rows: {
      "90": {
        physMultiplier: 0.190285,
        attributeMultiplier: 0.2854275,
        physFixed: 38.375,
        attributeFixed: 21.75,
      },
      "95": {
        physMultiplier: 0.1903475,
        attributeMultiplier: 0.28552125,
        physFixed: 44,
        attributeFixed: 24.625,
      },
      "100": {
        physMultiplier: 0.19041,
        attributeMultiplier: 0.285615,
        physFixed: 52.75,
        attributeFixed: 28.75,
      },
    },
  },
  {
    from: [0.228492, 0.342738, 63.3, 34.5],
    rows: {
      "90": {
        physMultiplier: 0.228342,
        attributeMultiplier: 0.342513,
        physFixed: 46.05,
        attributeFixed: 26.1,
      },
      "95": {
        physMultiplier: 0.228417,
        attributeMultiplier: 0.3426255,
        physFixed: 52.8,
        attributeFixed: 29.55,
      },
      "100": {
        physMultiplier: 0.228492,
        attributeMultiplier: 0.342738,
        physFixed: 63.3,
        attributeFixed: 34.5,
      },
    },
  },
  {
    from: [0.114246, 0.171369, 31.65, 17.25],
    rows: {
      "90": {
        physMultiplier: 0.114171,
        attributeMultiplier: 0.1712565,
        physFixed: 23.025,
        attributeFixed: 13.05,
      },
      "95": {
        physMultiplier: 0.1142085,
        attributeMultiplier: 0.17131275,
        physFixed: 26.4,
        attributeFixed: 14.775,
      },
      "100": {
        physMultiplier: 0.114246,
        attributeMultiplier: 0.171369,
        physFixed: 31.65,
        attributeFixed: 17.25,
      },
    },
  },
  {
    from: [0.456984, 0.685476, 126.6, 69],
    rows: {
      "90": {
        physMultiplier: 0.456684,
        attributeMultiplier: 0.685026,
        physFixed: 92.1,
        attributeFixed: 52.2,
      },
      "95": {
        physMultiplier: 0.456834,
        attributeMultiplier: 0.685251,
        physFixed: 105.6,
        attributeFixed: 59.1,
      },
      "100": {
        physMultiplier: 0.456984,
        attributeMultiplier: 0.685476,
        physFixed: 126.6,
        attributeFixed: 69,
      },
    },
  },
  {
    from: [0.685476, 1.028214, 189.9, 103.5],
    rows: {
      "90": {
        physMultiplier: 0.685026,
        attributeMultiplier: 1.027539,
        physFixed: 138.15,
        attributeFixed: 78.3,
      },
      "95": {
        physMultiplier: 0.685251,
        attributeMultiplier: 1.0278765,
        physFixed: 158.4,
        attributeFixed: 88.65,
      },
      "100": {
        physMultiplier: 0.685476,
        attributeMultiplier: 1.028214,
        physFixed: 189.9,
        attributeFixed: 103.5,
      },
    },
  },
  {
    from: [0.510829, 0.766243, 141.375, 77],
    rows: {
      "90": {
        physMultiplier: 0.51070375,
        attributeMultiplier: 0.766055625,
        physFixed: 102.75,
        attributeFixed: 58.5,
      },
      "95": {
        physMultiplier: 0.51076625,
        attributeMultiplier: 0.766149375,
        physFixed: 118,
        attributeFixed: 66,
      },
      "100": {
        physMultiplier: 0.51082875,
        attributeMultiplier: 0.766243125,
        physFixed: 141.375,
        attributeFixed: 77,
      },
    },
  },
  {
    from: [0.539718, 0.809577, 149.4, 81.4],
    rows: {
      "90": {
        physMultiplier: 0.539518,
        attributeMultiplier: 0.809277,
        physFixed: 108.6,
        attributeFixed: 61.8,
      },
      "95": {
        physMultiplier: 0.539618,
        attributeMultiplier: 0.809427,
        physFixed: 124.8,
        attributeFixed: 69.8,
      },
      "100": {
        physMultiplier: 0.539718,
        attributeMultiplier: 0.809577,
        physFixed: 149.4,
        attributeFixed: 81.4,
      },
    },
  },
  {
    from: [0.38293200000000005, 0.5743980000000001, 106.26, 57.75],
    rows: {
      "90": {
        physMultiplier: 0.382602,
        attributeMultiplier: 0.573903,
        physFixed: 77.22,
        attributeFixed: 43.89,
      },
      "95": {
        physMultiplier: 0.382767,
        attributeMultiplier: 0.5741505,
        physFixed: 88.77,
        attributeFixed: 49.5,
      },
      "100": {
        physMultiplier: 0.382932,
        attributeMultiplier: 0.574398,
        physFixed: 106.26,
        attributeFixed: 57.75,
      },
    },
  },
  {
    from: [0.286244, 0.429367, 79.16, 43.16],
    rows: {
      "90": {
        physMultiplier: 0.2862044,
        attributeMultiplier: 0.4293066,
        physFixed: 57.56,
        attributeFixed: 32.76,
      },
      "95": {
        physMultiplier: 0.2862244,
        attributeMultiplier: 0.4293366,
        physFixed: 66.12,
        attributeFixed: 36.96,
      },
      "100": {
        physMultiplier: 0.2862444,
        attributeMultiplier: 0.4293666,
        physFixed: 79.16,
        attributeFixed: 43.16,
      },
    },
  },
  {
    from: [0.304656, 0.456984, 84.4, 46],
    rows: {
      "90": {
        physMultiplier: 0.304456,
        attributeMultiplier: 0.456684,
        physFixed: 61.4,
        attributeFixed: 34.8,
      },
      "95": {
        physMultiplier: 0.304556,
        attributeMultiplier: 0.456834,
        physFixed: 70.4,
        attributeFixed: 39.4,
      },
      "100": {
        physMultiplier: 0.304656,
        attributeMultiplier: 0.456984,
        physFixed: 84.4,
        attributeFixed: 46,
      },
    },
  },
  {
    from: [2.3397, 3.5095, 648, 353],
    rows: {
      "90": {
        physMultiplier: 2.3381225,
        attributeMultiplier: 3.50718375,
        physFixed: 471,
        attributeFixed: 268.47,
      },
      "95": {
        physMultiplier: 2.3389075,
        attributeMultiplier: 3.50836125,
        physFixed: 541.65,
        attributeFixed: 303.01,
      },
      "100": {
        physMultiplier: 2.3396925,
        attributeMultiplier: 3.50953875,
        physFixed: 648.41,
        attributeFixed: 353.25,
      },
    },
  },
  {
    from: [0.439065, 0.658598, 122, 66.5],
    rows: {
      "90": {
        physMultiplier: 0.438565,
        attributeMultiplier: 0.6578475,
        physFixed: 88.5,
        attributeFixed: 50.5,
      },
      "95": {
        physMultiplier: 0.438815,
        attributeMultiplier: 0.6582225,
        physFixed: 102,
        attributeFixed: 57,
      },
      "100": {
        physMultiplier: 0.439065,
        attributeMultiplier: 0.6585975,
        physFixed: 122,
        attributeFixed: 66.5,
      },
    },
  },
  {
    from: [0.31677, 0.475155, 88, 48],
    rows: {
      "90": {
        physMultiplier: 0.31627,
        attributeMultiplier: 0.474405,
        physFixed: 64,
        attributeFixed: 36.5,
      },
      "95": {
        physMultiplier: 0.31652,
        attributeMultiplier: 0.47478,
        physFixed: 73.5,
        attributeFixed: 41,
      },
      "100": {
        physMultiplier: 0.31677,
        attributeMultiplier: 0.475155,
        physFixed: 88,
        attributeFixed: 48,
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
  if (!isRecord(skill) || typeof skill.id !== "string" || !skill.id.startsWith("silkbindJade-"))
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

export const V131__jadeLevelRows: CustomSkillMigration = {
  to: 131,
  name: "V131__jadeLevelRows",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 131, skills }
  },
}
