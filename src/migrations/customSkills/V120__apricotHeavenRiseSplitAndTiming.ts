// v119 → v120 — Apricot Heaven's rise is a trajectory hit of its own, summoned
// by the cast, and every hit lands later than the press-timed values it carried:
// the rise at 68.58 frames, the normal fall at 113.55, the enhanced fall at
// 203.55 and the second Endurance cost at 110.4, with the enhanced air-charge
// drain opening at 86.4. A Skill Editor copy seeded before this carries the old
// hits. A copy is rewritten only while its hits (and drain) still equal what
// was seeded: once they differ, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const NORMAL_ID = "silkbindJade-apricot-heaven-normal"
const ENHANCED_ID = "silkbindJade-apricot-heaven-enhanced"
const RISE_ID = "silkbindJade-apricot-heaven-rise"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, entry) =>
    isRecord(entry)
      ? Object.fromEntries(
          Object.entries(entry).sort(([left], [right]) => left.localeCompare(right)),
        )
      : entry,
  )

const RISE_ROW = {
  physMultiplier: 0.626038,
  attributeMultiplier: 0.939057,
  physFixed: 173.2,
  attributeFixed: 94.4,
}
const NORMAL_FALL_ROW = {
  physMultiplier: 1.565095,
  attributeMultiplier: 2.347643,
  physFixed: 433,
  attributeFixed: 236,
}
const ENHANCED_FALL_ROW = {
  physMultiplier: 2.504152,
  attributeMultiplier: 3.756228,
  physFixed: 692.8,
  attributeFixed: 377.6,
}
const NO_DAMAGE = {
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
}
const SECOND_COST = {
  kind: "meterDelta",
  targetId: "endurance",
  stacks: -5,
  condition: null,
}
const SUMMON_RISE = { kind: "castSkill", targetId: RISE_ID, stacks: 1, condition: null }

const row = (id: string, frame: number, values: object, triggers: object[] = []) => ({
  id,
  frame,
  ...values,
  extraCritDamage: 0,
  triggers,
})

const NORMAL_SEEDED = [
  row("hit-0", 54, RISE_ROW),
  row("hit-1", 72, NORMAL_FALL_ROW),
  row("hit-2", 96, NO_DAMAGE, [SECOND_COST]),
]
const NORMAL_HEALED = [
  row("hit-0", 68.58, NO_DAMAGE, [SUMMON_RISE]),
  row("hit-1", 113.55, NORMAL_FALL_ROW),
  row("hit-2", 110.4, NO_DAMAGE, [SECOND_COST]),
]
const ENHANCED_SEEDED = [
  row("hit-0", 54, RISE_ROW),
  row("hit-1", 96, NO_DAMAGE, [SECOND_COST]),
  row("hit-2", 162, ENHANCED_FALL_ROW),
]
const ENHANCED_HEALED = [
  row("hit-0", 68.58, NO_DAMAGE, [SUMMON_RISE]),
  row("hit-1", 110.4, NO_DAMAGE, [SECOND_COST]),
  row("hit-2", 203.55, ENHANCED_FALL_ROW),
]
const DRAIN = { meterId: "endurance", perSecond: 15, stopAfterSec: 1.5 }

const sameHits = (hits: unknown, seeded: readonly object[]): boolean =>
  canonical(hits) === canonical(seeded)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill)) return skill
  if (skill.id === NORMAL_ID && sameHits(skill.hits, NORMAL_SEEDED))
    return { ...skill, hits: NORMAL_HEALED.map((hit) => structuredClone(hit)) }
  if (skill.id !== ENHANCED_ID || !sameHits(skill.hits, ENHANCED_SEEDED)) return skill
  const drainsSeeded = canonical(skill.meterDrains) === canonical([{ ...DRAIN, fromFrame: 72 }])
  return {
    ...skill,
    hits: ENHANCED_HEALED.map((hit) => structuredClone(hit)),
    ...(drainsSeeded ? { meterDrains: [{ ...DRAIN, fromFrame: 86.4 }] } : {}),
  }
}

export const V120__apricotHeavenRiseSplitAndTiming: CustomSkillMigration = {
  to: 120,
  name: "V120__apricotHeavenRiseSplitAndTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 120, skills }
  },
}
