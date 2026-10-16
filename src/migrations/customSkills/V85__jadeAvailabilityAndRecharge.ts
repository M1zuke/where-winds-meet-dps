// Each part is rewritten only while it still equals what V84 left: once it
// differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const sameIds = (left: unknown, right: unknown): boolean =>
  Array.isArray(left) &&
  Array.isArray(right) &&
  left.length === right.length &&
  [...left].sort().join("|") === [...right].sort().join("|")

type Swap = readonly [from: unknown, to: unknown]

function swapField(
  record: RecordValue,
  key: string,
  swap: Swap | undefined,
  matches: (current: unknown, from: unknown) => boolean = sameValue,
): RecordValue {
  if (!swap || !matches(record[key], swap[0])) return record
  const healed = { ...record, [key]: swap[1] }
  if (swap[1] === undefined) delete healed[key]
  return healed
}

interface SkillPatch {
  triggersBuffs?: Swap
  triggersBuffsAtFrame?: Swap
  meterCosts?: Swap
  castConditions?: Swap
  hitTriggers?: readonly (Swap | undefined)[]
  hitAppended?: unknown
}

const EMERALD_BARRIER_COST = [{ meterId: "emeraldBarrierCharges", amount: 900 }]
const EMERALD_BARRIER_CONDITION = [
  { buffId: "meter:emeraldBarrierCharges", op: "gte", stacks: 900 },
]
const SPRING_SORROW_COST = [
  {
    meterId: "springSorrowCharges",
    amount: 900,
    requiresParam: "blossomBarrage",
    requiresMaxTier: 5,
  },
]
const SPRING_SORROW_CONDITION = [{ buffId: "meter:springSorrowCharges", op: "gte", stacks: 900 }]
const SPECIAL_COST = [{ meterId: "peaksSpringlessSilenceCharges", amount: 900 }]
const SPECIAL_CONDITION = [
  { buffId: "meter:peaksSpringlessSilenceCharges", op: "gte", stacks: 900 },
]

const MARK_GRANTS = ["lingeringBone", "starReacherSupreme", "starReacher"]
const JADEBREAK_AT_FRAME = { windWall: 10, windWallPursuit: 10 }

const SPECIAL_HIT_TRIGGERS_BEFORE = [
  {
    kind: "applyBuff",
    targetId: "gourdTossThunder",
    stacks: 1,
    condition: null,
    appliesOnCastEnd: true,
    requiresParam: "gourdToss",
    requiresMinTier: 3,
  },
  {
    kind: "applyBuff",
    targetId: "gourdTossFlyingTornado",
    stacks: 1,
    condition: null,
    appliesOnCastEnd: true,
    requiresParam: "gourdToss",
    requiresMinTier: 4,
  },
]
const SPECIAL_HIT_TRIGGERS_AFTER = [
  SPECIAL_HIT_TRIGGERS_BEFORE[0],
  {
    kind: "meterDelta",
    targetId: "peaksSpringlessSilenceCharges",
    stacks: 180,
    condition: null,
    appliesOnCastEnd: true,
    requiresParam: "gourdToss",
    requiresMinTier: 3,
  },
  {
    kind: "meterDelta",
    targetId: "peaksSpringlessSilenceCharges",
    stacks: 120,
    condition: null,
    cooldownFrames: 60,
    cooldownGroup: "gourdTossSpecialHit",
    requiresParam: "gourdToss",
    requiresMinTier: 6,
  },
  {
    kind: "applyBuff",
    targetId: "gourdTossPursuitCutWindow",
    stacks: 1,
    condition: null,
    cooldownFrames: 60,
    cooldownGroup: "gourdTossSpecialHit",
    durationFrames: 180,
    requiresParam: "gourdToss",
    requiresMinTier: 6,
  },
  {
    kind: "castSkill",
    targetId: "silkbindJade-fanspecial-windrider-grant",
    stacks: 1,
    condition: { buffId: "lingeringBone", op: "gte", stacks: 1, source: "buffEngine" },
  },
]
const WATER_CLONE_HIT = {
  id: "hit-1",
  frame: 0.24,
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
  extraCritDamage: 0,
  triggers: [
    {
      kind: "applyBuff",
      targetId: "waterClone",
      stacks: 1,
      condition: null,
      durationFrames: 300,
    },
  ],
}

const PURSUIT_RECHARGE_CUT = {
  kind: "meterDelta",
  targetId: "peaksSpringlessSilenceCharges",
  stacks: 60,
  condition: null,
  conditions: [{ buffId: "gourdTossPursuitCutWindow", op: "gte", stacks: 1 }],
  requiresParam: "gourdToss",
  requiresMinTier: 6,
}
const LINGERING_BONE_ON_ENGINE = {
  buffId: "lingeringBone",
  op: "gte",
  stacks: 1,
  source: "buffEngine",
}
const LOCKOUT_ON_ENGINE = {
  buffId: "moonShatterSpringLockout",
  op: "lte",
  stacks: 0,
  source: "buffEngine",
}
const WINDRIDER_ON_ENGINE = { buffId: "windrider", op: "gte", stacks: 1, source: "buffEngine" }
const PURSUIT_TRIGGERS_BEFORE = ["pursuitChargedBoost"]
const PURSUIT_TRIGGERS_AFTER = ["pursuitChargedBoost", "moonShatterSpringLockout"]

const PATCHES: Readonly<Record<string, SkillPatch>> = {
  "silkbindJade-fanq": {
    triggersBuffs: [
      ["jadeware", "windWall", "windWallPursuit", "springThunder"],
      ["jadeware", "windWall", "windWallPursuit", "windrider", "springThunder"],
    ],
    triggersBuffsAtFrame: [JADEBREAK_AT_FRAME, { ...JADEBREAK_AT_FRAME, windrider: 61.2 }],
    meterCosts: [undefined, EMERALD_BARRIER_COST],
    castConditions: [undefined, EMERALD_BARRIER_CONDITION],
  },
  "silkbindJade-fanqcancel": {
    meterCosts: [undefined, EMERALD_BARRIER_COST],
    castConditions: [undefined, EMERALD_BARRIER_CONDITION],
  },
  "silkbindJade-fanspecial": {
    triggersBuffs: [MARK_GRANTS, [...MARK_GRANTS, "gourdTossMoonShatterReset"]],
    meterCosts: [undefined, SPECIAL_COST],
    castConditions: [undefined, SPECIAL_CONDITION],
    hitTriggers: [[SPECIAL_HIT_TRIGGERS_BEFORE, SPECIAL_HIT_TRIGGERS_AFTER]],
    hitAppended: WATER_CLONE_HIT,
  },
  "silkbindJade-umbq": {
    meterCosts: [undefined, SPRING_SORROW_COST],
    castConditions: [undefined, SPRING_SORROW_CONDITION],
  },
  "silkbindJade-fanheavypursuit-3-hit": {
    triggersBuffs: [PURSUIT_TRIGGERS_BEFORE, PURSUIT_TRIGGERS_AFTER],
    castConditions: [undefined, [LINGERING_BONE_ON_ENGINE, LOCKOUT_ON_ENGINE]],
    hitTriggers: [
      [[], [PURSUIT_RECHARGE_CUT]],
      [[], [PURSUIT_RECHARGE_CUT]],
      [[], [PURSUIT_RECHARGE_CUT]],
    ],
  },
  "silkbindJade-fanheavypursuit-5-hit": {
    triggersBuffs: [PURSUIT_TRIGGERS_BEFORE, PURSUIT_TRIGGERS_AFTER],
    castConditions: [undefined, [LINGERING_BONE_ON_ENGINE, LOCKOUT_ON_ENGINE, WINDRIDER_ON_ENGINE]],
    hitTriggers: Array.from({ length: 5 }, () => [[], [PURSUIT_RECHARGE_CUT]] as Swap),
  },
}

function healHit(hit: unknown, swap: Swap | undefined): unknown {
  if (!swap || !isRecord(hit)) return hit
  return swapField(hit, "triggers", swap)
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const patch = PATCHES[skill.id]
  if (!patch) return skill
  let healed = skill
  healed = swapField(healed, "triggersBuffs", patch.triggersBuffs, sameIds)
  healed = swapField(healed, "triggersBuffsAtFrame", patch.triggersBuffsAtFrame)
  healed = swapField(healed, "meterCosts", patch.meterCosts)
  healed = swapField(healed, "castConditions", patch.castConditions)
  if (patch.hitTriggers && Array.isArray(healed.hits)) {
    const hitPatches = patch.hitTriggers
    const hits = healed.hits.map((hit, index) => healHit(hit, hitPatches[index]))
    const grewAHit =
      patch.hitAppended !== undefined &&
      hits.length === hitPatches.length &&
      !hits.some((hit) => isRecord(hit) && hit.id === (patch.hitAppended as RecordValue).id) &&
      sameValue((hits[0] as RecordValue).triggers, SPECIAL_HIT_TRIGGERS_AFTER)
    healed = { ...healed, hits: grewAHit ? [...hits, patch.hitAppended] : hits }
  }
  return healed
}

export const V85__jadeAvailabilityAndRecharge: CustomSkillMigration = {
  to: 85,
  name: "V85__jadeAvailabilityAndRecharge",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 85, skills }
  },
}
