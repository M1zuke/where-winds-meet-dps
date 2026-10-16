// v85 → v86 — Snowbreak Spring, Grave Frost, Total Annihilation (and Supreme),
// Slash, the Dual-Weapon Skill and Burning Heart stage 3 take their in-game
// frames, gates and exact coefficients, and Jadeware moves from Fleeting Trace
// to the class-108 skills. Each part is rewritten only while it still equals what
// V85 left: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

type Swap = readonly [from: unknown, to: unknown]

interface HitFieldSwap {
  hit: number
  field: string
  from: number
  to: number
}

interface SkillPatch {
  castConditions?: Swap
  castFrames?: Swap
  triggersBuffs?: Swap
  triggersBuffsAtFrame?: Swap
  hits?: Swap
  hitFields?: readonly HitFieldSwap[]
}

const AVAILABLE_CONDITION = { buffId: "snowbreakSpringAvailable", op: "gte", stacks: 1 }
const LOCKOUT_ABSENT_CONDITION = { buffId: "snowbreakSpringCooldown", op: "eq", stacks: 0 }
const BLADE_MOMENTUM_CONDITION = { buffId: "meter:bladeMomentum", op: "gte", stacks: 25 }

const SNOWBREAK_SPRING_CONDITIONS: Swap = [
  [AVAILABLE_CONDITION, BLADE_MOMENTUM_CONDITION],
  [AVAILABLE_CONDITION, LOCKOUT_ABSENT_CONDITION, BLADE_MOMENTUM_CONDITION],
]

const SNOWBREAK_SPRING_HITS_BEFORE = [
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
        kind: "applyBuff",
        targetId: "snowbreakSpringCooldown",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
      },
      {
        kind: "castSkill",
        targetId: "stonesplitStrength-anxisoldierheng",
        stacks: 0,
        condition: {
          buffId: "ironGuards",
          op: "gte",
          stacks: 1,
          source: "buffEngine",
        },
        requiresParam: "frostCladNight",
        requiresMinTier: 1,
      },
      {
        kind: "applyBuff",
        targetId: "buff-stonesplitStrength-dread",
        stacks: 0,
        condition: null,
        phase: "exhausted",
        extendFrames: 120,
        extendOnly: true,
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "applyBuff",
        targetId: "forgetfulness",
        stacks: 1,
        condition: {
          buffId: "forgetfulnessCooldown",
          op: "eq",
          stacks: 0,
        },
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "clearStatus",
        targetId: "forgetfulnessCooldown",
        stacks: 1,
        condition: null,
        phase: "exhausted",
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 12.5,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 3,
      },
    ],
  },
]

const SNOWBREAK_SPRING_HITS_AFTER = [
  {
    id: "hit-0",
    frame: 0,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyBuff",
        targetId: "snowbreakSpringCooldown",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
      },
      {
        kind: "clearStatus",
        targetId: "snowbreakSpringAvailable",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
      },
    ],
  },
  {
    id: "hit-1",
    frame: 30,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyBuff",
        targetId: "forgetfulness",
        stacks: 1,
        condition: {
          buffId: "forgetfulnessCooldown",
          op: "eq",
          stacks: 0,
        },
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
    ],
  },
  {
    id: "hit-2",
    frame: 34,
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
        condition: {
          buffId: "ironGuards",
          op: "gte",
          stacks: 1,
          source: "buffEngine",
        },
        requiresParam: "frostCladNight",
        requiresMinTier: 1,
      },
      {
        kind: "applyBuff",
        targetId: "buff-stonesplitStrength-dread",
        stacks: 0,
        condition: null,
        phase: "exhausted",
        extendFrames: 120,
        extendOnly: true,
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "applyBuff",
        targetId: "forgetfulness",
        stacks: 1,
        condition: null,
        phase: "exhausted",
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "clearStatus",
        targetId: "forgetfulnessCooldown",
        stacks: 1,
        condition: null,
        phase: "exhausted",
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 12.5,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 3,
      },
    ],
  },
]

const SNOWBREAK_SPRING_PREPULL_HITS_BEFORE = [
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
        kind: "applyBuff",
        targetId: "snowbreakSpringCooldown",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
      },
      {
        kind: "castSkill",
        targetId: "stonesplitStrength-anxisoldierheng",
        stacks: 0,
        condition: {
          buffId: "ironGuards",
          op: "gte",
          stacks: 1,
          source: "buffEngine",
        },
        requiresParam: "frostCladNight",
        requiresMinTier: 1,
      },
      {
        kind: "applyBuff",
        targetId: "forgetfulness",
        stacks: 1,
        condition: {
          buffId: "forgetfulnessCooldown",
          op: "eq",
          stacks: 0,
        },
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "clearStatus",
        targetId: "forgetfulnessCooldown",
        stacks: 1,
        condition: null,
        phase: "exhausted",
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 12.5,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 3,
      },
    ],
  },
]

const SNOWBREAK_SPRING_PREPULL_HITS_AFTER = [
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
        kind: "applyBuff",
        targetId: "snowbreakSpringCooldown",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
      },
      {
        kind: "clearStatus",
        targetId: "snowbreakSpringAvailable",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
      },
      {
        kind: "castSkill",
        targetId: "stonesplitStrength-anxisoldierheng",
        stacks: 0,
        condition: {
          buffId: "ironGuards",
          op: "gte",
          stacks: 1,
          source: "buffEngine",
        },
        requiresParam: "frostCladNight",
        requiresMinTier: 1,
      },
      {
        kind: "applyBuff",
        targetId: "forgetfulness",
        stacks: 1,
        condition: {
          buffId: "forgetfulnessCooldown",
          op: "eq",
          stacks: 0,
        },
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "clearStatus",
        targetId: "forgetfulnessCooldown",
        stacks: 1,
        condition: null,
        phase: "exhausted",
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 12.5,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 3,
      },
    ],
  },
]

const GRAVE_FROST_CONDITIONS: Swap = [
  [
    {
      buffId: "meter:endurance",
      op: "gt",
      stacks: 15,
    },
  ],
  [
    {
      buffId: "meter:endurance",
      op: "gt",
      stacks: 15,
    },
    {
      anyOf: [
        {
          buffId: "forgetfulness",
          op: "lt",
          stacks: 1,
        },
        {
          buffId: "forgetfulnessCooldown",
          op: "gte",
          stacks: 1,
        },
      ],
    },
  ],
]

const GRAVE_FROST_HITS_BEFORE = [
  {
    id: "hit-0",
    frame: 50,
    physMultiplier: 0.4899,
    attributeMultiplier: 0.734867,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-1",
    frame: 63,
    physMultiplier: 0.4899,
    attributeMultiplier: 0.734867,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-2",
    frame: 70,
    physMultiplier: 0.4899,
    attributeMultiplier: 0.734867,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyBuff",
        targetId: "snowbreakSpringAvailable",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 3,
      },
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-3",
    frame: 96,
    physMultiplier: 0.9798,
    attributeMultiplier: 1.4697,
    physFixed: 271.2,
    attributeFixed: 147.6,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
]

const GRAVE_FROST_HITS_AFTER = [
  {
    id: "hit-0",
    frame: 50,
    physMultiplier: 0.489916,
    attributeMultiplier: 0.734874,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-1",
    frame: 63,
    physMultiplier: 0.489916,
    attributeMultiplier: 0.734874,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-2",
    frame: 70,
    physMultiplier: 0.489916,
    attributeMultiplier: 0.734874,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-3",
    frame: 83,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyBuff",
        targetId: "snowbreakSpringAvailable",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 3,
      },
    ],
  },
  {
    id: "hit-4",
    frame: 96,
    physMultiplier: 0.979832,
    attributeMultiplier: 1.469748,
    physFixed: 271.2,
    attributeFixed: 147.6,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
]

const FREE_GRAVE_FROST_CONDITIONS: Swap = [
  undefined,
  [
    {
      buffId: "forgetfulness",
      op: "gte",
      stacks: 1,
    },
    {
      buffId: "forgetfulnessCooldown",
      op: "eq",
      stacks: 0,
    },
  ],
]

const FREE_GRAVE_FROST_HITS_BEFORE = [
  {
    id: "hit-0",
    frame: 11,
    physMultiplier: 0.4899,
    attributeMultiplier: 0.734867,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyBuff",
        targetId: "forgetfulnessCooldown",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-1",
    frame: 24,
    physMultiplier: 0.4899,
    attributeMultiplier: 0.734867,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-2",
    frame: 31,
    physMultiplier: 0.4899,
    attributeMultiplier: 0.734867,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyBuff",
        targetId: "snowbreakSpringAvailable",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 3,
      },
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-3",
    frame: 57,
    physMultiplier: 0.9798,
    attributeMultiplier: 1.4697,
    physFixed: 271.2,
    attributeFixed: 147.6,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
]

const FREE_GRAVE_FROST_HITS_AFTER = [
  {
    id: "hit-0",
    frame: 0,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyBuff",
        targetId: "forgetfulnessCooldown",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "clearStatus",
        targetId: "forgetfulness",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      {
        kind: "clearStatus",
        targetId: "snowbreakSpringCooldown",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
    ],
  },
  {
    id: "hit-1",
    frame: 11,
    physMultiplier: 0.489916,
    attributeMultiplier: 0.734874,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-2",
    frame: 24,
    physMultiplier: 0.489916,
    attributeMultiplier: 0.734874,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-3",
    frame: 31,
    physMultiplier: 0.489916,
    attributeMultiplier: 0.734874,
    physFixed: 135.6,
    attributeFixed: 73.8,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
  {
    id: "hit-4",
    frame: 44,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyBuff",
        targetId: "snowbreakSpringAvailable",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 3,
      },
    ],
  },
  {
    id: "hit-5",
    frame: 57,
    physMultiplier: 0.979832,
    attributeMultiplier: 1.469748,
    physFixed: 271.2,
    attributeFixed: 147.6,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "meterDelta",
        targetId: "bladeMomentum",
        stacks: 3.25,
        condition: null,
      },
    ],
  },
]

const PATCHES: Readonly<Record<string, SkillPatch>> = {
  "stonesplitStrength-snowpartingvc": {
    castConditions: SNOWBREAK_SPRING_CONDITIONS,
    hits: [SNOWBREAK_SPRING_HITS_BEFORE, SNOWBREAK_SPRING_HITS_AFTER],
  },
  "stonesplitStrength-snowpartingvc-prepull": {
    castConditions: SNOWBREAK_SPRING_CONDITIONS,
    hits: [SNOWBREAK_SPRING_PREPULL_HITS_BEFORE, SNOWBREAK_SPRING_PREPULL_HITS_AFTER],
  },
  "stonesplitStrength-snowpartingcharged": {
    castConditions: GRAVE_FROST_CONDITIONS,
    hits: [GRAVE_FROST_HITS_BEFORE, GRAVE_FROST_HITS_AFTER],
  },
  "stonesplitStrength-snowpartingcharged-forgetfulness": {
    castConditions: FREE_GRAVE_FROST_CONDITIONS,
    hits: [FREE_GRAVE_FROST_HITS_BEFORE, FREE_GRAVE_FROST_HITS_AFTER],
  },
  "stonesplitStrength-snowpartingdual": {
    hitFields: [
      { hit: 1, field: "physMultiplier", from: 0.6486, to: 0.64861 },
      { hit: 1, field: "attributeMultiplier", from: 0.9729, to: 0.972915 },
    ],
  },
  "stonesplitStrength-snowpartingq-slash": {
    triggersBuffs: [[], ["jadeware"]],
    hitFields: [{ hit: 1, field: "frame", from: 30, to: 29 }],
  },
  "stonesplitStrength-snowpartingq-stab": {
    triggersBuffs: [["throatPierced"], ["throatPierced", "jadeware"]],
  },
  "stonesplitStrength-snowpartingslide": { triggersBuffs: [undefined, ["jadeware"]] },
  "stonesplitStrength-snowpartingslide-prepull": { triggersBuffs: [undefined, ["jadeware"]] },
  "stonesplitStrength-snowpartingslide-prepull-hit": { triggersBuffs: [undefined, ["jadeware"]] },
  "stonesplitStrength-snowpartingspecial": {
    triggersBuffs: [["innerPassion", "jadeware"], ["innerPassion"]],
  },
  "stonesplitStrength-phalanxq": {
    triggersBuffs: [["throatPierced"], ["throatPierced", "jadeware"]],
    triggersBuffsAtFrame: [undefined, { jadeware: 7 }],
    hitFields: [{ hit: 0, field: "frame", from: 0, to: 26 }],
  },
  "stonesplitStrength-phalanxq-supreme": {
    triggersBuffs: [
      ["throatPierced", "totalAnnihilationSupremeShield"],
      ["throatPierced", "totalAnnihilationSupremeShield", "jadeware"],
    ],
    triggersBuffsAtFrame: [
      { totalAnnihilationSupremeShield: 42 },
      { totalAnnihilationSupremeShield: 222, jadeware: 180 },
    ],
    castFrames: [49, 222],
    hitFields: [{ hit: 0, field: "frame", from: 0, to: 194 }],
  },
  "stonesplitStrength-phalanxcharged-s3": {
    hitFields: [
      { hit: 2, field: "physMultiplier", from: 1.7199, to: 1.719879 },
      { hit: 2, field: "attributeMultiplier", from: 2.5798, to: 2.579819 },
      { hit: 3, field: "physMultiplier", from: 4.0131, to: 4.013051 },
      { hit: 3, field: "attributeMultiplier", from: 6.0196, to: 6.019577 },
    ],
  },
  "stonesplitStrength-phalanxcharged-s3-innerpassion": {
    hitFields: [
      { hit: 2, field: "physMultiplier", from: 1.7199, to: 1.719879 },
      { hit: 2, field: "attributeMultiplier", from: 2.5798, to: 2.579819 },
      { hit: 3, field: "physMultiplier", from: 4.0131, to: 4.013051 },
      { hit: 3, field: "attributeMultiplier", from: 6.0196, to: 6.019577 },
    ],
  },
}

function swapField(record: RecordValue, key: string, swap: Swap | undefined): RecordValue {
  if (!swap || !sameValue(record[key], swap[0])) return record
  const healed = { ...record, [key]: swap[1] }
  if (swap[1] === undefined) delete healed[key]
  return healed
}

function swapHitFields(hits: unknown, swaps: readonly HitFieldSwap[]): unknown {
  if (!Array.isArray(hits)) return hits
  return hits.map((hit, index) => {
    if (!isRecord(hit)) return hit
    return swaps
      .filter((swap) => swap.hit === index)
      .reduce<RecordValue>(
        (current, swap) => swapField(current, swap.field, [swap.from, swap.to]),
        hit,
      )
  })
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const patch = PATCHES[skill.id]
  if (!patch) return skill
  let healed = skill
  healed = swapField(healed, "castConditions", patch.castConditions)
  healed = swapField(healed, "castFrames", patch.castFrames)
  healed = swapField(healed, "triggersBuffs", patch.triggersBuffs)
  healed = swapField(healed, "triggersBuffsAtFrame", patch.triggersBuffsAtFrame)
  healed = swapField(healed, "hits", patch.hits)
  if (patch.hitFields) healed = { ...healed, hits: swapHitFields(healed.hits, patch.hitFields) }
  return healed
}

export const V86__stonesplitSnowbreakSpringGraveFrostAndSoulBurningTiming: CustomSkillMigration = {
  to: 86,
  name: "V86__stonesplitSnowbreakSpringGraveFrostAndSoulBurningTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 86, skills }
  },
}
