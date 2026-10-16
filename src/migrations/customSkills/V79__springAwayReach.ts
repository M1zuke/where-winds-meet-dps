// v78 → v79 — Spring Away's cast reaches 13 m (the Light Attack's approach
// range) instead of the class's melee default, and its bullets' collision box
// touches the target 0.5 m before the bullet's origin does. A Skill Editor
// copy seeded before this lacks both. Each part is added only while it is
// absent: once it exists, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const SPRING_AWAY_IDS: ReadonlySet<string> = new Set([
  "silkbindJade-umblightcharge",
  "silkbindJade-umblightcharge-12",
])
const REACH_METERS = 13
const CONTACT_ADVANCE_METERS = 0.5

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const withContactAdvance = (hit: unknown): unknown =>
  isRecord(hit) && isRecord(hit.projectile) && hit.projectile.contactAdvanceMeters === undefined
    ? { ...hit, projectile: { ...hit.projectile, contactAdvanceMeters: CONTACT_ADVANCE_METERS } }
    : hit

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !SPRING_AWAY_IDS.has(skill.id))
    return skill
  return {
    ...skill,
    ...(skill.reachMeters === undefined ? { reachMeters: REACH_METERS } : {}),
    ...(Array.isArray(skill.hits) ? { hits: skill.hits.map(withContactAdvance) } : {}),
  }
}

export const V79__springAwayReach: CustomSkillMigration = {
  to: 79,
  name: "V79__springAwayReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 79, skills }
  },
}
