// v25 → v26 — Stonesplit Strength's in-game accuracy pass: reach and gate
// corrections across the Snowparting/Phalanxbane soldier chain, the
// Snowbreak Spring / Grave Frost / Fleeting Trace / Dread values, and the
// Forgetfulness grant list. A Skill Editor copy seeded before any of it still
// carries the old shape for that skill. Only a copy still identical to what
// was seeded is rewritten — once it differs, a stale copy and a deliberate
// edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

interface FieldSnapshot {
  tags?: unknown
  receives?: unknown
  triggersBuffs?: unknown
  hits?: unknown
}

const IRON_GUARDS_ACTIVE = { buffId: "ironGuards", op: "gte", stacks: 1, source: "buffEngine" }

function shareHits(
  frames: readonly number[],
  physMultiplier: number,
  attributeMultiplier: number,
  physFixed: number,
  attributeFixed: number,
): Record<string, unknown>[] {
  return frames.map((frame, index) => ({
    id: `hit-${index}`,
    frame,
    physMultiplier,
    attributeMultiplier,
    physFixed,
    attributeFixed,
    extraCritDamage: 0,
    triggers: [],
  }))
}

const OLD: Record<string, FieldSnapshot> = {
  "stonesplitStrength-anxisoldierheng": {
    tags: ["weapon:Heng Blade", "prop:cleftpeakBoost", "role:anxiSoldier"],
    receives: ["cleftpeakDeflect", "snowpartingBladeAdditionalAttack"],
  },
  "stonesplitStrength-anxisoldiermosweep": {
    tags: ["weapon:Mo Blade", "prop:cleftpeakBoost", "role:anxiSoldier"],
    receives: ["cleftpeakDeflect", "phalanxbaneBladeAdditionalAttack"],
  },
  "stonesplitStrength-snowpartingq-stab": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 2.1324,
        attributeMultiplier: 3.1986,
        physFixed: 590,
        attributeFixed: 322,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldierheng",
            stacks: 0,
            condition: null,
          },
          {
            kind: "applyBuff",
            targetId: "buff-stonesplitStrength-dread",
            stacks: 0,
            condition: null,
            extendFrames: 360,
            extendOnly: true,
          },
          {
            kind: "applyBuff",
            targetId: "buff-stonesplitStrength-fearful-blade",
            stacks: 1,
            condition: null,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-snowpartingcharged": {
    triggersBuffs: ["forgetfulness"],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.3333,
        attributeFixed: 73.6667,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 24,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.3333,
        attributeFixed: 73.6667,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 48,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.3333,
        attributeFixed: 73.6667,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-3",
        frame: 72,
        physMultiplier: 0.9798,
        attributeMultiplier: 1.4697,
        physFixed: 271,
        attributeFixed: 147,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "stonesplitStrength-snowpartingcharged-forgetfulness": {
    triggersBuffs: ["forgetfulness"],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.3333,
        attributeFixed: 73.6667,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 14,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.3333,
        attributeFixed: 73.6667,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 28,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.3333,
        attributeFixed: 73.6667,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-3",
        frame: 42,
        physMultiplier: 0.9798,
        attributeMultiplier: 1.4697,
        physFixed: 271,
        attributeFixed: 147,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "stonesplitStrength-snowpartingdual": {
    tags: ["weapon:Heng Blade", "attune:snowpartingVariedCombo"],
    triggersBuffs: ["forgetfulness"],
  },
  "stonesplitStrength-snowpartingdual-prepull": {
    triggersBuffs: ["forgetfulness"],
  },
  "stonesplitStrength-deflect": {
    triggersBuffs: ["forgetfulness", "cleftpeakDeflectGrant"],
  },
  "stonesplitStrength-snowpartingspecial": {
    tags: ["weapon:Heng Blade", "attune:snowpartingQ"],
    hits: [
      ...shareHits(
        [0, 13, 26, 39, 52, 65, 78, 91],
        0.4199666667,
        0.6299555556,
        116.111111111111,
        63.33333333333,
      ),
      {
        id: "hit-8",
        frame: 104,
        physMultiplier: 0.4199666667,
        attributeMultiplier: 0.6299555556,
        physFixed: 116.111111111111,
        attributeFixed: 63.33333333333,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "applyBuff",
            targetId: "buff-stonesplitStrength-dread",
            stacks: 1,
            condition: null,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-snowpartingvc": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 2.0769,
        attributeMultiplier: 3.1153,
        physFixed: 575,
        attributeFixed: 313,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldierheng",
            stacks: 0,
            condition: null,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-snowpartingvc-prepull": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 2.0764,
        attributeMultiplier: 3.1145,
        physFixed: 480,
        attributeFixed: 268,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldierheng",
            stacks: 0,
            condition: null,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-phalanxcharged-s3": {
    tags: [
      "prop:isCharged",
      "prop:cleftpeakBoost",
      "weapon:Mo Blade",
      "attack:charge",
      "attune:phalanxbaneCharged",
      "role:phalanxCharged",
    ],
    receives: ["mountainSplitter", "cleftpeakDeflect", "phalanxbaneBladeAdditionalAttack"],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.7199,
        attributeMultiplier: 2.5798,
        physFixed: 475,
        attributeFixed: 259,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 94,
        physMultiplier: 4.0131,
        attributeMultiplier: 6.0196,
        physFixed: 1110,
        attributeFixed: 604,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldiermodown",
            stacks: 0,
            condition: null,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-phalanxcharged-s3-innerpassion": {
    receives: ["mountainSplitter", "cleftpeakDeflect", "phalanxbaneBladeAdditionalAttack"],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.7199,
        attributeMultiplier: 2.5798,
        physFixed: 475,
        attributeFixed: 259,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 69,
        physMultiplier: 4.0131,
        attributeMultiplier: 6.0196,
        physFixed: 1110,
        attributeFixed: 604,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldiermodown",
            stacks: 0,
            condition: null,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-phalanxq": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.8948,
        attributeMultiplier: 2.8422,
        physFixed: 525,
        attributeFixed: 286,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldiermosweep",
            stacks: 0,
            condition: null,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-anxisoldiermodown": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 0.5,
        attributeMultiplier: 0.75,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldiermojump",
            stacks: 0,
            condition: null,
          },
        ],
      },
    ],
  },
}

const NEW: Record<string, FieldSnapshot> = {
  "stonesplitStrength-anxisoldierheng": {
    tags: [
      "weapon:Heng Blade",
      "prop:cleftpeakBoost",
      "role:anxiSoldier",
      "attune:snowpartingVariedCombo",
    ],
    receives: ["mountainSplitter", "cleftpeakDeflect", "snowpartingBladeAdditionalAttack"],
  },
  "stonesplitStrength-anxisoldiermosweep": {
    tags: ["weapon:Mo Blade", "prop:cleftpeakBoost", "attune:phalanxbaneQ", "role:anxiSoldier"],
    receives: ["mountainSplitter", "cleftpeakDeflect", "phalanxbaneBladeAdditionalAttack"],
  },
  "stonesplitStrength-snowpartingq-stab": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 2.1324,
        attributeMultiplier: 3.1986,
        physFixed: 590,
        attributeFixed: 322,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldierheng-stab",
            stacks: 0,
            condition: IRON_GUARDS_ACTIVE,
          },
          {
            kind: "applyBuff",
            targetId: "buff-stonesplitStrength-dread",
            stacks: 0,
            condition: null,
            extendFrames: 120,
            extendOnly: true,
          },
          {
            kind: "applyBuff",
            targetId: "buff-stonesplitStrength-fearful-blade",
            stacks: 1,
            condition: null,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-snowpartingcharged": {
    triggersBuffs: [],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.6,
        attributeFixed: 73.8,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 24,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.6,
        attributeFixed: 73.8,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 48,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.6,
        attributeFixed: 73.8,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-3",
        frame: 72,
        physMultiplier: 0.9798,
        attributeMultiplier: 1.4697,
        physFixed: 271.2,
        attributeFixed: 147.6,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "stonesplitStrength-snowpartingcharged-forgetfulness": {
    triggersBuffs: [],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.6,
        attributeFixed: 73.8,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 14,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.6,
        attributeFixed: 73.8,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 28,
        physMultiplier: 0.4899,
        attributeMultiplier: 0.734867,
        physFixed: 135.6,
        attributeFixed: 73.8,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-3",
        frame: 42,
        physMultiplier: 0.9798,
        attributeMultiplier: 1.4697,
        physFixed: 271.2,
        attributeFixed: 147.6,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "stonesplitStrength-snowpartingdual": {
    tags: ["weapon:Heng Blade"],
    triggersBuffs: [],
  },
  "stonesplitStrength-snowpartingdual-prepull": {
    triggersBuffs: [],
  },
  "stonesplitStrength-deflect": {
    triggersBuffs: ["cleftpeakDeflectGrant"],
  },
  "stonesplitStrength-snowpartingspecial": {
    tags: ["weapon:Heng Blade"],
    hits: [
      ...shareHits([0, 13, 26, 39, 52, 65, 78, 91], 0.377968, 0.566952, 104.6, 57),
      {
        id: "hit-8",
        frame: 104,
        physMultiplier: 0.755936,
        attributeMultiplier: 1.133904,
        physFixed: 209.2,
        attributeFixed: 114,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "applyBuff",
            targetId: "buff-stonesplitStrength-dread",
            stacks: 1,
            condition: null,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-snowpartingvc": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 2.0769,
        attributeMultiplier: 3.1153,
        physFixed: 575,
        attributeFixed: 313,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldierheng",
            stacks: 0,
            condition: IRON_GUARDS_ACTIVE,
            requiresParam: "frostCladNight",
            requiresMinTier: 1,
          },
          {
            kind: "applyBuff",
            targetId: "buff-stonesplitStrength-dread",
            stacks: 0,
            condition: null,
            extendFrames: 120,
            extendOnly: true,
            phase: "exhausted",
            requiresParam: "frostCladNight",
            requiresMinTier: 6,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-snowpartingvc-prepull": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 2.07686,
        attributeMultiplier: 3.11529,
        physFixed: 575,
        attributeFixed: 313,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldierheng",
            stacks: 0,
            condition: IRON_GUARDS_ACTIVE,
            requiresParam: "frostCladNight",
            requiresMinTier: 1,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-phalanxcharged-s3": {
    tags: [
      "prop:isCharged",
      "prop:cleftpeakBoost",
      "prop:consumesInnerPassionBurningHeart",
      "weapon:Mo Blade",
      "attack:charge",
      "attune:phalanxbaneCharged",
      "role:phalanxCharged",
    ],
    receives: [
      "mountainSplitter",
      "mountainSplitterExhausted",
      "cleftpeakDeflect",
      "phalanxbaneBladeAdditionalAttack",
    ],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.7199,
        attributeMultiplier: 2.5798,
        physFixed: 475,
        attributeFixed: 259,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 94,
        physMultiplier: 4.0131,
        attributeMultiplier: 6.0196,
        physFixed: 1110,
        attributeFixed: 604,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldiermodown",
            stacks: 0,
            condition: IRON_GUARDS_ACTIVE,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-phalanxcharged-s3-innerpassion": {
    receives: [
      "mountainSplitter",
      "mountainSplitterExhausted",
      "cleftpeakDeflect",
      "phalanxbaneBladeAdditionalAttack",
    ],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.7199,
        attributeMultiplier: 2.5798,
        physFixed: 475,
        attributeFixed: 259,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 69,
        physMultiplier: 4.0131,
        attributeMultiplier: 6.0196,
        physFixed: 1110,
        attributeFixed: 604,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldiermodown",
            stacks: 0,
            condition: IRON_GUARDS_ACTIVE,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-phalanxq": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.8948,
        attributeMultiplier: 2.8422,
        physFixed: 525,
        attributeFixed: 286,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldiermosweep",
            stacks: 0,
            condition: IRON_GUARDS_ACTIVE,
          },
        ],
      },
    ],
  },
  "stonesplitStrength-anxisoldiermodown": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 0.5,
        attributeMultiplier: 0.75,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldiermojump",
            stacks: 0,
            condition: IRON_GUARDS_ACTIVE,
            requiresParam: "steadfastDevotion",
            requiresMinTier: 1,
          },
        ],
      },
    ],
  },
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false
    return left.every((item, index) => deepEqual(item, right[index]))
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Record<string, unknown>
    const rightRecord = right as Record<string, unknown>
    const leftKeys = Object.keys(leftRecord)
    const rightKeys = Object.keys(rightRecord)
    if (leftKeys.length !== rightKeys.length) return false
    return leftKeys.every(
      (key) => key in rightRecord && deepEqual(leftRecord[key], rightRecord[key]),
    )
  }
  return false
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SNAPSHOT_KEYS: (keyof FieldSnapshot)[] = ["tags", "receives", "triggersBuffs", "hits"]

export function healStonesplitStrengthValuesGatesReach(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const oldSnapshot = OLD[skill.id]
  const newSnapshot = NEW[skill.id]
  if (!oldSnapshot || !newSnapshot) return skill
  const oldKeys = SNAPSHOT_KEYS.filter((key) => key in oldSnapshot)
  if (!oldKeys.every((key) => deepEqual(skill[key], oldSnapshot[key]))) return skill
  const healed = { ...skill }
  for (const key of oldKeys) {
    if (key in newSnapshot) healed[key] = newSnapshot[key]
    else delete healed[key]
  }
  return healed
}

export const V26__stonesplitStrengthValuesGatesReach: CustomSkillMigration = {
  to: 26,
  name: "V26__stonesplitStrengthValuesGatesReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healStonesplitStrengthValuesGatesReach)
      : blob.skills
    return { ...blob, v: 26, skills }
  },
}
