// v108 → v109 — the single-hit Dragon's Breath lands on frame 36, as the other
// Dragon's Breath forms do (was 40). A Skill Editor copy seeded before this
// still carries 40. Only a value still identical to what was seeded is
// rewritten: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const SINGLE_HIT_ID = "mystic-fire-breath-1-hit"

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== SINGLE_HIT_ID || !Array.isArray(skill.hits)) return skill
  const [firstHit, ...otherHits] = skill.hits
  if (!isRecord(firstHit) || firstHit.frame !== 40) return skill
  return { ...skill, hits: [{ ...firstHit, frame: 36 }, ...otherHits] }
}

export const V109__dragonBreathSingleHitFastFrame: CustomSkillMigration = {
  to: 109,
  name: "V109__dragonBreathSingleHitFastFrame",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 109, skills }
  },
}
