// v97 → v98 — Sword Horizon's two re-added Bleeding stacks come back as the
// Blood Burst lands, not at the detonating hit, and only while Sword Spirit is
// banked; the same two stacks Sweep All's burst added at the Sweep All hit now
// come from the burst itself. A Skill Editor copy seeded before this still
// carries the Sweep All trigger pair and a Blood Burst without the stacks.
// Only a trigger still identical to what was seeded is touched: once it
// differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const BLOOD_BURST_ID = "bellstrikeUmbra-bleed-detonation"
const SWEEP_ALL_IDS: ReadonlySet<string> = new Set([
  "bellstrikeUmbra-spearspecial",
  "bellstrikeUmbra-spearspecial-1-hit-cancel",
])
const BLEED_TICK_ID = "debuff-bellstrikeUmbra-bleed-tick"
const EMPOWERED_RIVER_FLOW_ID = "buff-bellstrikeUmbra-empowered-river-flow"
const SWORD_SPIRIT_BANKED_ID = "buff-bellstrikeUmbra-zenith-spirit"
const SWORD_HORIZON_PARAM = "swordHorizon"
const SWORD_HORIZON_BURST_MIN_TIER = 6

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isSweepAllBurstStack = (trigger: unknown): boolean =>
  isRecord(trigger) &&
  trigger.kind === "applyDot" &&
  trigger.targetId === BLEED_TICK_ID &&
  isRecord(trigger.condition) &&
  trigger.condition.buffId === EMPOWERED_RIVER_FLOW_ID &&
  trigger.requiresParam === SWORD_HORIZON_PARAM &&
  trigger.requiresMinTier === SWORD_HORIZON_BURST_MIN_TIER

const isBleedApplication = (trigger: unknown): boolean =>
  isRecord(trigger) && trigger.kind === "applyDot" && trigger.targetId === BLEED_TICK_ID

const burstStack = (): RecordValue => ({
  kind: "applyDot",
  targetId: BLEED_TICK_ID,
  stacks: 1,
  condition: { buffId: SWORD_SPIRIT_BANKED_ID, op: "gte", stacks: 1 },
  requiresParam: SWORD_HORIZON_PARAM,
  requiresMinTier: SWORD_HORIZON_BURST_MIN_TIER,
})

function withoutSweepAllBurstStacks(skill: RecordValue, hits: unknown[]): RecordValue {
  return {
    ...skill,
    hits: hits.map((hit) =>
      isRecord(hit) && Array.isArray(hit.triggers)
        ? { ...hit, triggers: hit.triggers.filter((trigger) => !isSweepAllBurstStack(trigger)) }
        : hit,
    ),
  }
}

function withBurstStacks(skill: RecordValue, hits: unknown[]): RecordValue {
  const [first, ...rest] = hits
  if (!isRecord(first) || !Array.isArray(first.triggers)) return skill
  if (first.triggers.some(isBleedApplication)) return skill
  return {
    ...skill,
    hits: [{ ...first, triggers: [burstStack(), burstStack(), ...first.triggers] }, ...rest],
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  if (SWEEP_ALL_IDS.has(skill.id)) return withoutSweepAllBurstStacks(skill, skill.hits)
  if (skill.id === BLOOD_BURST_ID) return withBurstStacks(skill, skill.hits)
  return skill
}

export const V98__swordHorizonBurstStacksAtTheBurst: CustomSkillMigration = {
  to: 98,
  name: "V98__swordHorizonBurstStacksAtTheBurst",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 98, skills }
  },
}
