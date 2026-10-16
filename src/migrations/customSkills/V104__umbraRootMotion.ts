// v103 → v104 — the Sword Charge releases, the Inner Track Slash family, the
// Crisscross follow-ups, Inner Balance Strike, the sword heavy attacks and
// Crosswind Blade move by the metres their animation travels, with the
// distance bands the game switches on. A Skill Editor copy seeded before this
// carries the earlier displacement, or none. Only a displacement still
// identical to what was seeded is rewritten: once it differs, a stale copy and
// a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface Form {
  previous: readonly unknown[]
  next: RecordValue
  variantMotion?: RecordValue
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

const rootMotion = (flatKeys: readonly number[], throughTarget = false): RecordValue => ({
  kind: "rootMotion",
  metersAtFrame: Array.from({ length: flatKeys.length / 2 }, (_, index) => [
    flatKeys[index * 2],
    flatKeys[index * 2 + 1],
  ]),
  ...(throughTarget ? { throughTarget } : {}),
})

const SWORD_CHARGE_STAGE_1_1_HIT_MOTION = [
  0, 0, 30, 0, 32, 0.194, 34, 0.577, 36, 0.952, 37.76, 1.274,
]
const SWORD_CHARGE_STAGE_1_2_HIT_MOTION = [
  0, 0, 30, 0, 32, 0.194, 34, 0.577, 36, 0.952, 38, 1.318, 40, 1.964, 42, 2.759, 44, 3.882, 46,
  5.184, 48, 6.208, 50, 6.813, 52, 6.998, 54, 7.093, 56, 7.153, 58, 7.191, 60, 7.22, 62, 7.251,
  62.46, 7.257,
]
const SWORD_CHARGE_STAGE_1_3_HIT_MOTION = [
  0, 0, 30, 0, 32, 0.194, 34, 0.577, 36, 0.952, 38, 1.318, 40, 1.964, 42, 2.759, 44, 3.882, 46,
  5.184, 48, 6.208, 50, 6.813, 52, 6.998, 54, 7.093, 56, 7.153, 58, 7.191, 60, 7.22, 62, 7.251, 64,
  7.279, 66, 7.304, 68, 7.328, 70, 7.352, 72, 7.376, 72.25, 7.38,
]
const SWORD_CHARGE_STAGE_1_4_HIT_MOTION = [
  0, 0, 30, 0, 32, 0.194, 34, 0.577, 36, 0.952, 38, 1.318, 40, 1.964, 42, 2.759, 44, 3.882, 46,
  5.184, 48, 6.208, 50, 6.813, 52, 6.998, 54, 7.093, 56, 7.153, 58, 7.191, 60, 7.22, 62, 7.251, 64,
  7.279, 66, 7.304, 68, 7.328, 70, 7.352, 72, 7.376, 74, 7.401, 76, 7.427, 78, 7.447, 80, 7.466, 82,
  7.497, 82.11, 7.5,
]
const SWORD_CHARGE_STAGE_1_5_HIT_MOTION = [
  0, 0, 30, 0, 32, 0.194, 34, 0.577, 36, 0.952, 38, 1.318, 40, 1.964, 42, 2.759, 44, 3.882, 46,
  5.184, 48, 6.208, 50, 6.813, 52, 6.998, 54, 7.093, 56, 7.153, 58, 7.191, 60, 7.22, 62, 7.251, 64,
  7.279, 66, 7.304, 68, 7.328, 70, 7.352, 72, 7.376, 74, 7.401, 76, 7.427, 78, 7.447, 80, 7.466, 82,
  7.497, 84, 7.558, 86, 7.66, 88, 7.775, 90, 7.897, 92, 8.023, 94, 8.14, 96, 8.229, 98, 8.279, 100,
  8.312, 102, 8.34, 104, 8.363, 106, 8.381, 108, 8.396, 110, 8.41, 112, 8.423, 114, 8.433, 116,
  8.442, 118, 8.45, 120, 8.455, 122, 8.458, 124, 8.461, 126, 8.463, 128, 8.465, 130, 8.466, 134,
  8.466, 136, 8.465, 138, 8.462, 140, 8.458, 142, 8.454, 144, 8.449, 146, 8.445, 148, 8.441, 150,
  8.438, 152, 8.436,
]
const SWORD_CHARGE_STAGE_2_4_HIT_MOTION = [
  0, 0, 84, 0, 86, 0.194, 88, 0.577, 90, 0.952, 92, 1.318, 94, 1.964, 96, 2.759, 98, 3.882, 100,
  5.184, 102, 6.208, 104, 6.813, 106, 6.998, 108, 7.093, 110, 7.153, 112, 7.191, 114, 7.22, 116,
  7.251, 118, 7.279, 120, 7.304, 122, 7.328, 124, 7.352, 126, 7.376, 128, 7.401, 130, 7.427, 132,
  7.447, 134, 7.466, 136, 7.497, 136.11, 7.5,
]
const SWORD_CHARGE_STAGE_2_5_HIT_MOTION = [
  0, 0, 84, 0, 86, 0.194, 88, 0.577, 90, 0.952, 92, 1.318, 94, 1.964, 96, 2.759, 98, 3.882, 100,
  5.184, 102, 6.208, 104, 6.813, 106, 6.998, 108, 7.093, 110, 7.153, 112, 7.191, 114, 7.22, 116,
  7.251, 118, 7.279, 120, 7.304, 122, 7.328, 124, 7.352, 126, 7.376, 128, 7.401, 130, 7.427, 132,
  7.447, 134, 7.466, 136, 7.497, 138, 7.558, 140, 7.66, 142, 7.775, 144, 7.897, 146, 8.023, 148,
  8.14, 150, 8.229, 152, 8.279, 154, 8.312, 156, 8.34, 158, 8.363, 160, 8.381, 162, 8.396, 164,
  8.41, 166, 8.423, 168, 8.433, 170, 8.442, 172, 8.45, 174, 8.455, 176, 8.458, 178, 8.461, 180,
  8.463, 182, 8.465, 184, 8.466, 188, 8.466, 190, 8.465, 192, 8.462, 194, 8.458, 196, 8.454, 198,
  8.449, 200, 8.445, 202, 8.441, 204, 8.438, 206, 8.436, 207, 8.435,
]
const SWORD_CHARGE_STAGE_1_LEVEL_0_MOTION = [
  0, 0, 12, 0, 14, 0.08, 16, 0.12, 18, 0.199, 20, 0.279, 22, 0.363, 24, 0.452, 26, 0.549, 28, 0.656,
  30, 0.774, 32, 0.908, 34, 1.056, 36, 1.214, 38, 1.378, 40, 1.544, 42, 1.708, 44, 1.867, 46, 2.001,
  48, 2.049, 50, 2.041,
]
const SWORDQ_MOTION = [0, 0, 27, 0.8]
const SWORDQ_FOLLOW_UP_MOTION = [
  0, 0, 2, 0.189, 4, 0.541, 6, 0.826, 8, 0.93, 10, 1.073, 12, 1.219, 14, 1.309, 16, 1.471, 18,
  1.704, 20, 1.96, 22, 2.223, 24, 2.386, 26, 2.515, 28, 2.69, 30, 2.832, 32, 2.924, 34, 3.028, 36,
  3.131, 38, 3.234, 40, 3.377, 42, 3.589, 44, 3.75, 46, 3.878, 48, 3.971, 50, 3.975, 52, 3.977, 54,
  3.976, 56, 3.974, 58, 3.971, 60, 3.968, 62, 3.964, 64, 3.96,
]
const SWORDQ_FOLLOW_UP_2_HIT_CANCEL_MOTION = [
  0, 0, 2, 0.189, 4, 0.541, 6, 0.826, 8, 0.93, 10, 1.073, 12, 1.219, 14, 1.309, 16, 1.471, 18,
  1.704, 20, 1.96, 22, 2.223, 24, 2.386, 25, 2.442,
]
const SWORDQ_FOLLOW_UP_1_HIT_CANCEL_MOTION = [0, 0, 2, 0.189, 4, 0.541, 6, 0.826, 7, 0.875]
const SWORD_R_CHARGE_FOLLOW_UP_MOTION = [
  0, 0, 2, -0.02, 4, -0.048, 6, 0.059, 8, 0.406, 10, 0.773, 12, 1.003, 14, 1.192, 16, 1.386, 18,
  1.626, 20, 2.076, 22, 2.7, 24, 3.173, 26, 3.443, 28, 3.653, 30, 3.844, 32, 4.04, 34, 4.276, 36,
  4.592, 38, 4.976, 40, 5.371, 42, 5.768, 44, 6.192, 46, 6.54, 48, 6.693, 50, 6.736, 52, 6.765, 54,
  6.786, 56, 6.804, 58, 6.815, 60, 6.818, 62, 6.817, 64, 6.816, 66, 6.817, 68, 6.817, 70, 6.818, 72,
  6.819, 74, 6.82, 76, 6.821, 78, 6.821, 80, 6.822, 82, 6.823, 87, 6.823,
]
const SWORD_R_CHARGE_FOLLOW_UP_1_HIT_CANCEL_MOTION = [
  0, 0, 2, -0.02, 4, -0.048, 6, 0.059, 8, 0.406, 10, 0.773, 12, 1.003, 14, 1.192, 16, 1.386,
]
const SWORD_MARTIAL_QQQ_MOTION = [
  0, 0, 2, 0.064, 4, 0.08, 6, 0.133, 8, 0.187, 10, 0.241, 12, 0.296, 14, 0.353, 16, 0.411, 18,
  0.469, 20, 0.529, 22, 0.591, 24, 0.654, 26, 0.726, 28, 0.806, 30, 0.889, 32, 0.962, 34, 1.011, 36,
  1.039, 38, 1.054, 40, 1.06, 42, 1.062, 44, 1.065, 46, 1.068, 48, 1.071, 50, 1.073, 52, 1.075, 54,
  1.079, 56, 1.083, 58, 1.09, 60, 1.103, 62, 1.125, 64, 1.149, 66, 1.169, 68, 1.181, 70, 1.19, 72,
  1.195, 74, 1.198, 76, 1.202, 78, 1.209, 80, 1.216, 82, 1.225, 84, 1.234, 86, 1.244,
]
const SWORDSPECIAL_1_HIT_MOTION = [
  0, 0, 2, 0.019, 4, 0.037, 6, 0.06, 8, 0.098, 10, 0.151, 12, 0.205, 14, 0.259, 16, 0.257, 18,
  0.226, 20, 0.168, 22, 0.05, 24, -0.199, 26, -0.447, 28, -0.7, 29.8, -0.902,
]
const SWORDSPECIAL_2_HIT_MOTION = [
  0, 0, 2, 0.019, 4, 0.037, 6, 0.06, 8, 0.098, 10, 0.151, 12, 0.205, 14, 0.259, 16, 0.257, 18,
  0.226, 20, 0.168, 22, 0.05, 24, -0.199, 26, -0.447, 28, -0.7, 30, -0.923, 32, -1.112, 34, -1.278,
  36, -1.412, 36.16, -1.421,
]
const SWORDSPECIAL_3_HIT_MOTION = [
  0, 0, 2, 0.019, 4, 0.037, 6, 0.06, 8, 0.098, 10, 0.151, 12, 0.205, 14, 0.259, 16, 0.257, 18,
  0.226, 20, 0.168, 22, 0.05, 24, -0.199, 26, -0.447, 28, -0.7, 30, -0.923, 32, -1.112, 34, -1.278,
  36, -1.412, 38, -1.522, 40, -1.648, 42, -1.839, 44, -2.116, 46, -2.455, 48, -2.782, 50, -2.996,
  52, -3.169, 54, -3.313, 56, -3.435, 58, -3.538, 60, -3.628, 62, -3.695, 63.78, -3.708,
]
const SWORDSPECIAL_4_HIT_MOTION = [
  0, 0, 2, 0.019, 4, 0.037, 6, 0.06, 8, 0.098, 10, 0.151, 12, 0.205, 14, 0.259, 16, 0.257, 18,
  0.226, 20, 0.168, 22, 0.05, 24, -0.199, 26, -0.447, 28, -0.7, 30, -0.923, 32, -1.112, 34, -1.278,
  36, -1.412, 38, -1.522, 40, -1.648, 42, -1.839, 44, -2.116, 46, -2.455, 48, -2.782, 50, -2.996,
  52, -3.169, 54, -3.313, 56, -3.435, 58, -3.538, 60, -3.628, 62, -3.695, 64, -3.708, 84, -3.708,
]
const SWORD_HEAVY_2_MOTION = [
  0, 0, 2, 0.127, 4, 0.318, 6, 0.599, 8, 0.733, 10, 0.788, 12, 0.843, 14, 0.915, 16, 0.987, 18,
  1.107, 20, 1.276, 22, 1.446, 24, 1.601, 26, 1.701, 28, 1.771, 30, 1.827, 32, 1.881, 34, 1.967, 36,
  2.083, 38, 2.201, 40, 2.321, 42, 2.442, 44, 2.561, 46, 2.678, 48, 2.792, 50, 2.9, 53, 2.9,
]
const SWORD_HEAVY_3_MOTION = [
  0, 0, 2, 0.032, 4, 0.064, 6, 0.094, 8, 0.122, 10, 0.158, 12, 0.209, 14, 0.321, 16, 0.46, 18,
  0.584, 20, 0.68, 22, 0.751, 24, 0.82, 26, 0.877, 28, 0.921, 30, 0.961, 32, 1.005, 34, 1.057, 36,
  1.114, 38, 1.178, 40, 1.252, 42, 1.337, 44, 1.431, 46, 1.535, 48, 1.658, 50, 1.78, 52, 1.863, 54,
  1.925, 56, 1.979, 58, 2.032, 60, 2.083, 62, 2.131, 64, 2.169, 66, 2.179, 68, 2.176, 73, 2.176,
]
const SWORDQ_FOLLOW_UP_61_F_MOTION = [
  0, 0, 2, 0.189, 4, 0.541, 6, 0.826, 8, 0.93, 10, 1.073, 12, 1.219, 14, 1.309, 16, 1.471, 18,
  1.704, 20, 1.96, 22, 2.223, 24, 2.386, 26, 2.515, 28, 2.69, 30, 2.832, 32, 2.924, 34, 3.028, 36,
  3.131, 38, 3.234, 40, 3.377, 42, 3.589, 44, 3.75, 46, 3.878, 48, 3.971, 50, 3.975, 52, 3.977, 54,
  3.976, 56, 3.974, 58, 3.971, 60, 3.968, 61, 3.966,
]

const OLD_BY_DISTANCE = {
  kind: "byDistance",
  bands: [
    { minMeters: 0, maxMeters: 8.999, then: { kind: "toTarget", meters: 1 } },
    { minMeters: 9, maxMeters: 100, then: { kind: "selfForward", meters: 8 } },
  ],
  otherwise: { kind: "towardTarget", referenceMeters: 0 },
}

const NONE: readonly unknown[] = [undefined]
const ON_THE_SPOT = { kind: "towardTarget", referenceMeters: 0 }

const CROSSWIND_BLADE_DISPLACEMENT = {
  kind: "byDistance",
  bands: [{ minMeters: 6, maxMeters: 8.999, then: { kind: "selfForward", meters: 11 } }],
  otherwise: ON_THE_SPOT,
}

const chargeRelease = (
  flatKeys: readonly number[],
  betweenSixAndNineMeters: unknown,
): RecordValue => ({
  kind: "byDistance",
  bands: [{ minMeters: 6.0001, maxMeters: 9, then: betweenSixAndNineMeters }],
  otherwise: rootMotion(flatKeys, true),
})

const WARPED_RELEASE = { kind: "selfForward", meters: 8.7 }
const WARPED_FULL_RELEASE = { kind: "selfForward", meters: 11 }

const FORMS: Readonly<Record<string, Form>> = {
  "bellstrikeUmbra-sword-charge-stage-1-1-hit": {
    previous: [OLD_BY_DISTANCE],
    next: chargeRelease(SWORD_CHARGE_STAGE_1_1_HIT_MOTION, OLD_BY_DISTANCE),
  },
  "bellstrikeUmbra-sword-charge-stage-1-2-hit": {
    previous: [OLD_BY_DISTANCE],
    next: chargeRelease(SWORD_CHARGE_STAGE_1_2_HIT_MOTION, WARPED_RELEASE),
  },
  "bellstrikeUmbra-sword-charge-stage-1-3-hit": {
    previous: [OLD_BY_DISTANCE],
    next: chargeRelease(SWORD_CHARGE_STAGE_1_3_HIT_MOTION, WARPED_RELEASE),
  },
  "bellstrikeUmbra-sword-charge-stage-1-4-hit": {
    previous: [OLD_BY_DISTANCE],
    next: chargeRelease(SWORD_CHARGE_STAGE_1_4_HIT_MOTION, WARPED_RELEASE),
  },
  "bellstrikeUmbra-sword-charge-stage-1-5-hit": {
    previous: [OLD_BY_DISTANCE],
    next: chargeRelease(SWORD_CHARGE_STAGE_1_5_HIT_MOTION, WARPED_FULL_RELEASE),
  },
  "bellstrikeUmbra-sword-charge-stage-2-4-hit": {
    previous: [OLD_BY_DISTANCE],
    next: chargeRelease(SWORD_CHARGE_STAGE_2_4_HIT_MOTION, WARPED_RELEASE),
  },
  "bellstrikeUmbra-sword-charge-stage-2-5-hit": {
    previous: [OLD_BY_DISTANCE],
    next: chargeRelease(SWORD_CHARGE_STAGE_2_5_HIT_MOTION, WARPED_FULL_RELEASE),
  },
  "bellstrikeUmbra-sword-charge-stage-1-level-0": {
    previous: [OLD_BY_DISTANCE],
    next: {
      kind: "byDistance",
      bands: [
        { minMeters: 0, maxMeters: 1.499, then: ON_THE_SPOT },
        { minMeters: 1.5, maxMeters: 2.999, then: { kind: "toTarget", meters: 1.1 } },
      ],
      otherwise: rootMotion(SWORD_CHARGE_STAGE_1_LEVEL_0_MOTION),
    },
  },
  "bellstrikeUmbra-swordq": {
    previous: NONE,
    next: {
      kind: "byDistance",
      bands: [{ minMeters: 2.5001, maxMeters: 10, then: { kind: "toTarget", meters: 1.5 } }],
      otherwise: rootMotion(SWORDQ_MOTION),
    },
  },
  "bellstrikeUmbra-swordqfollowup": {
    previous: NONE,
    next: rootMotion(SWORDQ_FOLLOW_UP_MOTION),
    variantMotion: rootMotion(SWORDQ_FOLLOW_UP_61_F_MOTION),
  },
  "bellstrikeUmbra-swordq-follow-up-2-hit-cancel": {
    previous: NONE,
    next: rootMotion(SWORDQ_FOLLOW_UP_2_HIT_CANCEL_MOTION),
  },
  "bellstrikeUmbra-swordq-follow-up-1-hit-cancel": {
    previous: NONE,
    next: rootMotion(SWORDQ_FOLLOW_UP_1_HIT_CANCEL_MOTION),
  },
  "bellstrikeUmbra-sword-r-charge-follow-up": {
    previous: NONE,
    next: rootMotion(SWORD_R_CHARGE_FOLLOW_UP_MOTION),
  },
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel": {
    previous: NONE,
    next: rootMotion(SWORD_R_CHARGE_FOLLOW_UP_1_HIT_CANCEL_MOTION),
  },
  "bellstrikeUmbra-sword-martial-qqq": {
    previous: NONE,
    next: rootMotion(SWORD_MARTIAL_QQQ_MOTION),
  },
  "bellstrikeUmbra-swordspecial-1-hit": {
    previous: NONE,
    next: rootMotion(SWORDSPECIAL_1_HIT_MOTION),
  },
  "bellstrikeUmbra-swordspecial-2-hit": {
    previous: NONE,
    next: rootMotion(SWORDSPECIAL_2_HIT_MOTION),
  },
  "bellstrikeUmbra-swordspecial-3-hit": {
    previous: NONE,
    next: rootMotion(SWORDSPECIAL_3_HIT_MOTION),
  },
  "bellstrikeUmbra-swordspecial-4-hit": {
    previous: NONE,
    next: rootMotion(SWORDSPECIAL_4_HIT_MOTION),
  },
  "bellstrikeUmbra-sword-heavy-2": {
    previous: NONE,
    next: rootMotion(SWORD_HEAVY_2_MOTION),
  },
  "bellstrikeUmbra-sword-heavy-3": {
    previous: NONE,
    next: rootMotion(SWORD_HEAVY_3_MOTION),
  },
  "bellstrikeUmbra-crosswind-blade": { previous: NONE, next: CROSSWIND_BLADE_DISPLACEMENT },
  "bellstrikeUmbra-crosswind-blade-cancel": { previous: NONE, next: CROSSWIND_BLADE_DISPLACEMENT },
}

const withVariantMotion = (hits: unknown, variantMotion: RecordValue): unknown => {
  if (!Array.isArray(hits) || !isRecord(hits[0]) || !Array.isArray(hits[0].variants)) return hits
  const [firstVariant, ...otherVariants] = hits[0].variants
  if (!isRecord(firstVariant) || firstVariant.displacement !== undefined) return hits
  return [
    { ...hits[0], variants: [{ ...firstVariant, displacement: variantMotion }, ...otherVariants] },
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
    displacement: JSON.parse(JSON.stringify(form.next)),
    ...(form.variantMotion ? { hits: withVariantMotion(skill.hits, form.variantMotion) } : {}),
  }
}

export const V104__umbraRootMotion: CustomSkillMigration = {
  to: 104,
  name: "V104__umbraRootMotion",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 104, skills }
  },
}
