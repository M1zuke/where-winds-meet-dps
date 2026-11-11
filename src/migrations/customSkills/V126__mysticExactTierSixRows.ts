// v125 → v126 — a mystic art's tier-6 row is the exact in-game value. A Skill
// Editor copy seeded at v125 holds the rounded tier-6 row together with level
// rows built on it. Only a hit or variant whose own row and whose tier-6 level
// row both still equal that rounded row takes the exact row: once a value
// differs, a stale copy and a deliberate edit are indistinguishable.
import { matchesRow, withRow, type HitRow } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

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
    from: [0.701728, 1.052591, 110.3386, 0],
    rows: {
      "5": {
        physMultiplier: 0.661667535751,
        attributeMultiplier: 0.992501303627,
        physFixed: 81.576,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 0.701727587896,
        attributeMultiplier: 1.05259138184,
        physFixed: 110.33856,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.41491, 2.122364, 225.8728, 0],
    rows: {
      "6": {
        physMultiplier: 1.4149095283,
        attributeMultiplier: 2.12236429245,
        physFixed: 225.872830189,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.283899, 1.925849, 204.9587, 0],
    rows: {
      "6": {
        physMultiplier: 1.28389938679,
        attributeMultiplier: 1.92584908019,
        physFixed: 204.958679245,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [19.07564, 28.61346, 3001.372, 0],
    rows: {
      "5": {
        physMultiplier: 17.990698,
        attributeMultiplier: 26.986047,
        physFixed: 2218.7,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 19.07563988,
        attributeMultiplier: 28.61345982,
        physFixed: 3001.372,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [12.597266, 18.895899, 1999.4721, 0],
    rows: {
      "6": {
        physMultiplier: 12.5972659585,
        attributeMultiplier: 18.8958989377,
        physFixed: 1999.47207547,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.49975, 2.249625, 237.2652, 0],
    rows: {
      "5": {
        physMultiplier: 1.413585,
        attributeMultiplier: 2.1203775,
        physFixed: 174.42,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.4997501,
        attributeMultiplier: 2.24962515,
        physFixed: 237.2652,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.360884, 2.041327, 215.2962, 0],
    rows: {
      "5": {
        physMultiplier: 1.2826975,
        attributeMultiplier: 1.92404625,
        physFixed: 158.27,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.36088435,
        attributeMultiplier: 2.041326525,
        physFixed: 215.2962,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [3.955457, 5.933186, 881.2783, 0],
    rows: {
      "5": {
        physMultiplier: 3.64549841282,
        attributeMultiplier: 5.46824761924,
        physFixed: 708.639792953,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 3.9554570066,
        attributeMultiplier: 5.93318550991,
        physFixed: 881.27825035,
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
    from: [1.4342834, 2.1514251, 225.90800000000002, 0],
    rows: {
      "5": {
        physMultiplier: 1.35215406563,
        attributeMultiplier: 2.02823109845,
        physFixed: 166.8,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.43428330957,
        attributeMultiplier: 2.15142496435,
        physFixed: 225.908,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [0.8605700399999999, 1.29085506, 135.54479999999998, 0],
    rows: {
      "5": {
        physMultiplier: 0.811292439378,
        attributeMultiplier: 1.21693865907,
        physFixed: 100.08,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 0.860569985741,
        attributeMultiplier: 1.29085497861,
        physFixed: 135.5448,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.705588, 2.558382, 268.184, 0],
    rows: {
      "5": {
        physMultiplier: 1.60821970495,
        attributeMultiplier: 2.41232955743,
        physFixed: 198.275,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.70558788725,
        attributeMultiplier: 2.55838183087,
        physFixed: 268.184,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.023353, 1.535029, 160.9104, 0],
    rows: {
      "5": {
        physMultiplier: 0.964931822971,
        attributeMultiplier: 1.44739773446,
        physFixed: 118.965,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.02335273235,
        attributeMultiplier: 1.53502909852,
        physFixed: 160.9104,
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
    from: [1.608126, 2.412189, 252.8592, 0],
    rows: {
      "5": {
        physMultiplier: 1.5163214361,
        attributeMultiplier: 2.27448215415,
        physFixed: 186.945,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.60812572226,
        attributeMultiplier: 2.41218858339,
        physFixed: 252.8592,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [3.196543, 4.794815, 504.027, 0],
    rows: {
      "5": {
        physMultiplier: 3.01348427461,
        attributeMultiplier: 4.52022641192,
        physFixed: 371.7,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 3.19654333109,
        attributeMultiplier: 4.79481499663,
        physFixed: 504.027,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [3.906886, 5.860329, 616.033, 0],
    rows: {
      "5": {
        physMultiplier: 3.68314744675,
        attributeMultiplier: 5.52472117012,
        physFixed: 454.3,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 3.90688629355,
        attributeMultiplier: 5.86032944033,
        physFixed: 616.033,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [3.244011, 4.866017, 509.5968, 0],
    rows: {
      "5": {
        physMultiplier: 3.059256,
        attributeMultiplier: 4.588884,
        physFixed: 377.28,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 3.24401136,
        attributeMultiplier: 4.86601704,
        physFixed: 509.5968,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [3.060433, 4.59065, 484.9404, 0],
    rows: {
      "6": {
        physMultiplier: 3.06043335849,
        attributeMultiplier: 4.59065003774,
        physFixed: 484.940377358,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [3.978563, 5.967845, 630.4225, 0],
    rows: {
      "6": {
        physMultiplier: 3.97856336604,
        attributeMultiplier: 5.96784504906,
        physFixed: 630.422490566,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [0.510072, 0.765108, 80.8234, 0],
    rows: {
      "6": {
        physMultiplier: 0.510072226415,
        attributeMultiplier: 0.765108339623,
        physFixed: 80.8233962264,
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
  {
    from: [0.540669, 0.811003, 84.9328, 0],
    rows: {
      "5": {
        physMultiplier: 0.509876,
        attributeMultiplier: 0.764814,
        physFixed: 62.88,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 0.54066856,
        attributeMultiplier: 0.81100284,
        physFixed: 84.9328,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.3603122, 2.0404683, 214.29200000000003, 0],
    rows: {
      "5": {
        physMultiplier: 1.28237006563,
        attributeMultiplier: 1.92355509845,
        physFixed: 158.2,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.36031226957,
        attributeMultiplier: 2.04046840435,
        physFixed: 214.292,
        attributeFixed: 0,
      },
    },
  },
  {
    from: [1.02023415, 1.530351225, 160.719, 0],
    rows: {
      "5": {
        physMultiplier: 0.961777549223,
        attributeMultiplier: 1.44266632383,
        physFixed: 118.65,
        attributeFixed: 0,
      },
      "6": {
        physMultiplier: 1.02023420218,
        attributeMultiplier: 1.53035130326,
        physFixed: 160.719,
        attributeFixed: 0,
      },
    },
  },
]

type RowLike = Record<string, unknown>

const isRecord = (value: unknown): value is RowLike =>
  !!value && typeof value === "object" && !Array.isArray(value)

function exactRow(row: RowLike): RowLike {
  const levelRows = row.levelRows
  if (!isRecord(levelRows) || !isRecord(levelRows.rows) || !isRecord(levelRows.rows["6"]))
    return row
  const tierSix = levelRows.rows["6"]
  const swap = EXACT_SWAPS.find(
    (candidate) => matchesRow(row, candidate.from) && matchesRow(tierSix, candidate.from),
  )
  if (!swap) return row
  const top = swap.rows["6"]!
  return {
    ...withRow(row, [
      top.physMultiplier,
      top.attributeMultiplier,
      top.physFixed,
      top.attributeFixed,
    ]),
    levelRows: { ...levelRows, rows: structuredClone(swap.rows) },
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !skill.id.startsWith("mystic-"))
    return skill
  if (!Array.isArray(skill.hits)) return skill
  const hits = skill.hits.map((hit: unknown) => {
    if (!isRecord(hit)) return hit
    const healed = exactRow(hit)
    if (!Array.isArray(hit.variants)) return healed
    const variants = hit.variants.map((variant: unknown) =>
      isRecord(variant) ? exactRow(variant) : variant,
    )
    return { ...healed, variants }
  })
  return { ...skill, hits }
}

export const V126__mysticExactTierSixRows: CustomSkillMigration = {
  to: 126,
  name: "V126__mysticExactTierSixRows",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 126, skills }
  },
}
