// v102 → v103 — the Vagrant Sword forms, Energy Surge, Shadow Step and the sword
// heavy attack move by the metres their animation travels instead of shrinking
// the distance by a fixed reference, and the three-wave forms carry their own
// motion. A Skill Editor copy seeded before this still carries the earlier
// displacement. Only a displacement still identical to what was seeded is
// rewritten: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface Form {
  previous: readonly unknown[]
  motion: readonly number[]
  variantMotion?: readonly number[]
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameValue = (left: unknown, right: unknown): boolean => {
  if (Array.isArray(left) || Array.isArray(right))
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => sameValue(item, right[index]))
    )
  if (isRecord(left) && isRecord(right)) {
    const keys = Object.keys(left)
    return (
      keys.length === Object.keys(right).length &&
      keys.every((key) => key in right && sameValue(left[key], right[key]))
    )
  }
  return left === right
}

const rootMotion = (flatKeys: readonly number[]): RecordValue => ({
  kind: "rootMotion",
  metersAtFrame: Array.from({ length: flatKeys.length / 2 }, (_, index) => [
    flatKeys[index * 2],
    flatKeys[index * 2 + 1],
  ]),
})

const VAGRANT_SWORD_SINGLE_BOLT_MOTION = [
  0, 0, 84, 0, 86, 0.029, 88, 0.073, 90, 0.132, 92, 0.213, 94, 0.311, 96, 0.406, 98, 0.493, 100,
  0.591, 102, 0.68, 104, 0.785, 106, 0.843, 108, 0.881, 110, 0.912, 112, 0.944, 114, 0.982, 116,
  1.038, 118, 1.12, 120, 1.211, 121.8, 1.274,
]
const VAGRANT_SWORD_THREE_WAVE_MOTION = [
  0, 0, 84, 0, 86, 0.034, 88, 0.087, 90, 0.166, 92, 0.278, 94, 0.394, 96, 0.497, 98, 0.61, 100,
  0.722, 102, 0.822, 104, 0.873, 106, 0.91, 108, 0.948, 110, 0.995, 112, 1.074, 114, 1.186, 116,
  1.272, 118, 1.322, 120, 1.357, 122, 1.379, 124, 1.389, 126, 1.392, 128, 1.391, 130, 1.392, 132,
  1.395, 134, 1.401, 135.6, 1.405,
]
const VAGRANT_SWORD_2_HIT_MOTION = [
  0, 0, 84, 0, 86, 0.034, 88, 0.087, 90, 0.166, 92, 0.278, 94, 0.394, 96, 0.497, 98, 0.61, 100,
  0.722, 101.62, 0.81,
]
const VAGRANT_SWORD_TIER_1_MOTION = [
  0, 0, 44, 0, 46, 0.008, 48, 0.05, 50, 0.096, 52, 0.167, 54, 0.262, 56, 0.36, 58, 0.449, 60, 0.543,
  62, 0.635, 64, 0.732, 66, 0.817, 68, 0.864, 70, 0.897, 72, 0.927, 74, 0.961, 76, 1.003, 78, 1.075,
  80, 1.169, 82, 1.247, 82.8, 1.274,
]
const VAGRANT_SWORD_WUSHUANG_SINGLE_BOLT_MOTION = [
  0, 0, 60, 0, 62, 0.05, 64, 0.132, 66, 0.262, 68, 0.406, 70, 0.543, 72, 0.68, 74, 0.817, 76, 0.881,
  78, 0.927, 80, 0.982, 82, 1.075, 84, 1.211, 85.2, 1.274,
]
const VAGRANT_SWORD_WUSHUANG_THREE_WAVE_MOTION = [
  0, 0, 60, 0, 62, 0.039, 64, 0.092, 66, 0.176, 68, 0.29, 70, 0.404, 72, 0.509, 74, 0.621, 76,
  0.734, 78, 0.828, 80, 0.877, 82, 0.914, 84, 0.952, 86, 1, 88, 1.083, 90, 1.197, 92, 1.277, 94,
  1.326, 96, 1.36, 98, 1.38, 100, 1.39, 102, 1.392, 104, 1.391, 106, 1.392, 108, 1.396, 110, 1.401,
  111.4, 1.405,
]
const VAGRANT_SWORD_2_HIT_WUSHUANG_MOTION = [
  0, 0, 60, 0, 62, 0.039, 64, 0.092, 66, 0.176, 68, 0.29, 70, 0.404, 72, 0.509, 74, 0.621, 76,
  0.734, 77.42, 0.81,
]
const VAGRANT_SWORD_TIER_1_WUSHUANG_MOTION = [
  0, 0, 34, 0, 36, 0.05, 38, 0.132, 40, 0.262, 42, 0.406, 44, 0.543, 46, 0.68, 48, 0.817, 50, 0.881,
  52, 0.927, 54, 0.982, 56, 1.075, 58, 1.211, 59.2, 1.274,
]
const VAGRANT_SWORD_PREPULL_SINGLE_BOLT_MOTION = [
  0, 0, 2, 0.042, 4, 0.087, 6, 0.153, 8, 0.242, 10, 0.34, 12, 0.432, 14, 0.523, 16, 0.618, 18,
  0.711, 20, 0.807, 22, 0.857, 24, 0.891, 26, 0.921, 28, 0.954, 30, 0.994, 32, 1.06, 34, 1.15, 36,
  1.233, 37.2, 1.274,
]
const THREE_WAVE_FROM_CAST_START_MOTION = [
  0, 0, 2, 0.05, 4, 0.108, 6, 0.198, 8, 0.313, 10, 0.424, 12, 0.532, 14, 0.642, 16, 0.759, 18, 0.84,
  20, 0.885, 22, 0.921, 24, 0.96, 26, 1.013, 28, 1.105, 30, 1.213, 32, 1.287, 34, 1.333, 36, 1.365,
  38, 1.383, 40, 1.391, 42, 1.392, 44, 1.391, 46, 1.392, 48, 1.397, 50, 1.403, 51, 1.405,
]
const SHADOW_STEP_MOTION = [
  0, 0, 2, -0.055, 4, -0.106, 6, -0.14, 8, -0.133, 10, -0.104, 12, -0.072, 14, -0.029, 16, -0.085,
  18, -0.283, 20, -0.508, 22, -0.738, 24, -0.97, 26, -1.207, 28, -1.446, 30, -1.688, 32, -1.931, 34,
  -2.175, 36, -2.421, 38, -2.667, 40, -2.911, 42, -3.156, 44, -3.4,
]
const SWORD_HEAVY_ATTACK_MOTION = [
  0, 0, 2, 0, 4, 0.08, 6, 0.159, 8, 0.238, 10, 0.32, 12, 0.406, 14, 0.498, 16, 0.6, 18, 0.712, 20,
  0.837, 22, 0.979, 24, 1.133, 26, 1.294, 28, 1.461, 30, 1.627, 32, 1.789, 34, 1.944, 36, 2.057, 38,
  2.041, 40, 2.167, 42, 2.359, 44, 2.639, 46, 2.773, 48, 2.829, 50, 2.884, 52, 2.956, 54, 3.028, 56,
  3.148, 58, 3.317, 60, 3.486, 62, 3.642, 64, 3.741, 66, 3.812, 68, 3.868, 70, 3.922, 72, 4.008, 74,
  4.123, 76, 4.242, 78, 4.362, 80, 4.482, 82, 4.602, 84, 4.719, 86, 4.832, 88, 4.941, 100, 4.941,
  102, 4.957, 104, 4.989, 106, 5.021, 108, 5.048, 110, 5.079, 112, 5.124, 114, 5.206, 116, 5.328,
  118, 5.47, 120, 5.581, 122, 5.657, 124, 5.727, 126, 5.79, 128, 5.842, 130, 5.882, 132, 5.921, 134,
  5.971, 136, 6.026, 138, 6.087, 140, 6.155, 142, 6.233, 144, 6.323, 146, 6.421, 148, 6.537, 150,
  6.66, 152, 6.768, 154, 6.839, 156, 6.894, 158, 6.947, 160, 6.999, 162, 7.048, 164, 7.092, 166,
  7.123, 168, 7.118, 170, 7.117, 174, 7.117,
]

const OLD_BY_DISTANCE = {
  kind: "byDistance",
  bands: [
    { minMeters: 0, maxMeters: 8.999, then: { kind: "toTarget", meters: 1 } },
    { minMeters: 9, maxMeters: 100, then: { kind: "selfForward", meters: 8 } },
  ],
  otherwise: { kind: "towardTarget", referenceMeters: 0 },
}
const OLD_TOWARD_1_75 = { kind: "towardTarget", referenceMeters: 1.75 }
const OLD_TOWARD_1 = { kind: "towardTarget", referenceMeters: 1 }

const VAGRANT_PREVIOUS = [OLD_BY_DISTANCE, OLD_TOWARD_1_75]

const FORMS: Readonly<Record<string, Form>> = {
  "bellstrikeSplendor-swordheavycharged": {
    previous: VAGRANT_PREVIOUS,
    motion: VAGRANT_SWORD_SINGLE_BOLT_MOTION,
    variantMotion: VAGRANT_SWORD_THREE_WAVE_MOTION,
  },
  "bellstrikeSplendor-swordheavycharged-2-hit": {
    previous: VAGRANT_PREVIOUS,
    motion: VAGRANT_SWORD_2_HIT_MOTION,
  },
  "bellstrikeSplendor-swordheavycharged-tier-1": {
    previous: VAGRANT_PREVIOUS,
    motion: VAGRANT_SWORD_TIER_1_MOTION,
  },
  "bellstrikeSplendor-swordheavycharged-wushuang": {
    previous: VAGRANT_PREVIOUS,
    motion: VAGRANT_SWORD_WUSHUANG_SINGLE_BOLT_MOTION,
    variantMotion: VAGRANT_SWORD_WUSHUANG_THREE_WAVE_MOTION,
  },
  "bellstrikeSplendor-swordheavycharged-2-hit-wushuang": {
    previous: VAGRANT_PREVIOUS,
    motion: VAGRANT_SWORD_2_HIT_WUSHUANG_MOTION,
  },
  "bellstrikeSplendor-swordheavycharged-tier-1-wushuang": {
    previous: VAGRANT_PREVIOUS,
    motion: VAGRANT_SWORD_TIER_1_WUSHUANG_MOTION,
  },
  "bellstrikeSplendor-swordheavycharged-prepull": {
    previous: VAGRANT_PREVIOUS,
    motion: VAGRANT_SWORD_PREPULL_SINGLE_BOLT_MOTION,
    variantMotion: THREE_WAVE_FROM_CAST_START_MOTION,
  },
  "bellstrikeSplendor-energysurge": {
    previous: [OLD_BY_DISTANCE, OLD_TOWARD_1],
    motion: THREE_WAVE_FROM_CAST_START_MOTION,
  },
  "bellstrikeSplendor-swordspecial": {
    previous: [OLD_TOWARD_1],
    motion: SHADOW_STEP_MOTION,
  },
  "bellstrikeSplendor-sword-heavy-attack": {
    previous: [OLD_TOWARD_1_75],
    motion: SWORD_HEAVY_ATTACK_MOTION,
  },
}

const withVariantMotion = (hits: unknown, variantMotion: readonly number[]): unknown => {
  if (!Array.isArray(hits) || !isRecord(hits[0]) || !Array.isArray(hits[0].variants)) return hits
  const [firstVariant, ...otherVariants] = hits[0].variants
  if (!isRecord(firstVariant) || firstVariant.displacement !== undefined) return hits
  return [
    {
      ...hits[0],
      variants: [{ ...firstVariant, displacement: rootMotion(variantMotion) }, ...otherVariants],
    },
    ...hits.slice(1),
  ]
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const form = FORMS[skill.id]
  if (!form || !form.previous.some((previous) => sameValue(skill.displacement, previous)))
    return skill
  return {
    ...skill,
    displacement: rootMotion(form.motion),
    ...(form.variantMotion ? { hits: withVariantMotion(skill.hits, form.variantMotion) } : {}),
  }
}

export const V103__splendorRootMotion: CustomSkillMigration = {
  to: 103,
  name: "V103__splendorRootMotion",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 103, skills }
  },
}
