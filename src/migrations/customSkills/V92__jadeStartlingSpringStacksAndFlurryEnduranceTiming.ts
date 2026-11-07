// A Moon Shatter Spring hit stacks Startling Spring on the hit, every Charged
// skill the class has takes its damage bonus, and Forsaken Fame's Endurance
// gain lands 0.03 s after its hit instead of at the cast's end. A Skill Editor
// copy is rewritten only while it still equals what V91 left: once it
// differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const FLURRY_ENDURANCE_BEFORE = [
  {
    kind: "meterDelta",
    targetId: "endurance",
    stacks: 10,
    condition: null,
    appliesOnCastEnd: true,
  },
]
const FLURRY_ENDURANCE_AFTER = [
  { kind: "meterDelta", targetId: "endurance", stacks: 10, condition: null, delayFrames: 1.8 },
]

const PURSUIT_RECHARGE_CUT = {
  kind: "meterDelta",
  targetId: "peaksSpringlessSilenceCharges",
  stacks: 60,
  condition: null,
  conditions: [{ buffId: "gourdTossPursuitCutWindow", op: "gte", stacks: 1 }],
  requiresParam: "gourdToss",
  requiresMinTier: 6,
}
const STARTLING_SPRING_STACK = {
  kind: "applyBuff",
  targetId: "pursuitChargedBoost",
  stacks: 1,
  condition: null,
}
const PURSUIT_HIT_BEFORE = [PURSUIT_RECHARGE_CUT]
const PURSUIT_HIT_AFTER = [PURSUIT_RECHARGE_CUT, STARTLING_SPRING_STACK]

const HIT_TRIGGERS: Readonly<Record<string, readonly [before: unknown, after: unknown]>> = {
  "silkbindJade-fanlightcharged": [FLURRY_ENDURANCE_BEFORE, FLURRY_ENDURANCE_AFTER],
  "silkbindJade-fanheavypursuit-3-hit": [PURSUIT_HIT_BEFORE, PURSUIT_HIT_AFTER],
  "silkbindJade-fanheavypursuit-5-hit": [PURSUIT_HIT_BEFORE, PURSUIT_HIT_AFTER],
}

const UMBRELLA_RECEIVES_BEFORE = ["vernalUmbrellaAdditionalAttack"]
const FAN_RECEIVES_BEFORE = ["inkwellFanAdditionalAttack"]
const CHARGED_SKILL_RECEIVES: Readonly<Record<string, readonly string[]>> = {
  "silkbindJade-apricot-heaven-normal": UMBRELLA_RECEIVES_BEFORE,
  "silkbindJade-apricot-heaven-enhanced": UMBRELLA_RECEIVES_BEFORE,
  "silkbindJade-glow-and-flow-stage-1": FAN_RECEIVES_BEFORE,
  "silkbindJade-glow-and-flow-stage-2": FAN_RECEIVES_BEFORE,
}

const sameIds = (left: unknown, right: readonly string[]): boolean =>
  Array.isArray(left) &&
  left.length === right.length &&
  [...left].sort().join("|") === [...right].sort().join("|")

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const before = CHARGED_SKILL_RECEIVES[skill.id]
  if (before)
    return sameIds(skill.receives, before)
      ? { ...skill, receives: ["pursuitChargedBoost", ...before] }
      : skill
  const swap = HIT_TRIGGERS[skill.id]
  if (!swap || !Array.isArray(skill.hits)) return skill
  const hits = skill.hits.map((hit) =>
    isRecord(hit) && sameValue(hit.triggers, swap[0]) ? { ...hit, triggers: swap[1] } : hit,
  )
  return { ...skill, hits }
}

export const V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming: CustomSkillMigration = {
  to: 92,
  name: "V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 92, skills }
  },
}
