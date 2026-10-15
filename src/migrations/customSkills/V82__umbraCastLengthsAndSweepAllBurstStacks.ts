// v81 → v82 — Drifting Thrust casts for its hold plus the finisher's own cast
// length, the second-press cancel forms end one frame past their last kept
// hit, the second Crisscross - Inner Track hit lands on frame 72, and the two
// Bleeding stacks Sweep All's burst adds need Sword Horizon tier 6. A Skill
// Editor copy seeded before this still carries the old values. Only a value
// still identical to what was seeded is rewritten: once it differs, a stale
// copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface Retiming {
  from: number
  to: number
}

const CAST_FRAMES: Readonly<Record<string, Retiming>> = {
  "bellstrikeUmbra-spearheavy-1-hit": { from: 78, to: 68 },
  "bellstrikeUmbra-spearheavy-stage-1": { from: 120, to: 173 },
  "bellstrikeUmbra-spearheavy": { from: 246, to: 302 },
  "bellstrikeUmbra-swordq-follow-up-1-hit-cancel": { from: 24, to: 7 },
  "bellstrikeUmbra-swordq-follow-up-2-hit-cancel": { from: 42, to: 25 },
}

const QQQ_ID = "bellstrikeUmbra-sword-martial-qqq"
const QQQ_SECOND_HIT_INDEX = 1
const QQQ_SECOND_HIT: Retiming = { from: 71, to: 72 }

const SWEEP_ALL_IDS: ReadonlySet<string> = new Set([
  "bellstrikeUmbra-spearspecial",
  "bellstrikeUmbra-spearspecial-1-hit-cancel",
])
const BLEED_TICK_ID = "debuff-bellstrikeUmbra-bleed-tick"
const EMPOWERED_RIVER_FLOW_ID = "buff-bellstrikeUmbra-empowered-river-flow"
const SWORD_HORIZON_PARAM = "swordHorizon"
const SWORD_HORIZON_BURST_MIN_TIER = 6

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isUngatedBurstStack = (trigger: unknown): boolean =>
  isRecord(trigger) &&
  trigger.kind === "applyDot" &&
  trigger.targetId === BLEED_TICK_ID &&
  isRecord(trigger.condition) &&
  trigger.condition.buffId === EMPOWERED_RIVER_FLOW_ID &&
  Array.isArray(trigger.conditions) &&
  trigger.conditions.length === 1 &&
  trigger.requiresParam === undefined

const gatedTrigger = (trigger: unknown): unknown =>
  isUngatedBurstStack(trigger)
    ? {
        ...(trigger as RecordValue),
        requiresParam: SWORD_HORIZON_PARAM,
        requiresMinTier: SWORD_HORIZON_BURST_MIN_TIER,
      }
    : trigger

const gatedHit = (hit: unknown): unknown =>
  isRecord(hit) && Array.isArray(hit.triggers)
    ? { ...hit, triggers: hit.triggers.map(gatedTrigger) }
    : hit

const retimedQqqHit = (hit: unknown, index: number): unknown =>
  index === QQQ_SECOND_HIT_INDEX && isRecord(hit) && hit.frame === QQQ_SECOND_HIT.from
    ? { ...hit, frame: QQQ_SECOND_HIT.to }
    : hit

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const castFrames = CAST_FRAMES[skill.id]
  if (castFrames && skill.castFrames === castFrames.from) {
    return { ...skill, castFrames: castFrames.to }
  }
  if (skill.id === QQQ_ID && Array.isArray(skill.hits)) {
    return { ...skill, hits: skill.hits.map(retimedQqqHit) }
  }
  if (SWEEP_ALL_IDS.has(skill.id) && Array.isArray(skill.hits)) {
    return { ...skill, hits: skill.hits.map(gatedHit) }
  }
  return skill
}

export const V82__umbraCastLengthsAndSweepAllBurstStacks: CustomSkillMigration = {
  to: 82,
  name: "V82__umbraCastLengthsAndSweepAllBurstStacks",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 82, skills }
  },
}
