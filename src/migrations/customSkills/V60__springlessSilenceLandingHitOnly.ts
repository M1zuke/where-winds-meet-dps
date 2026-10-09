// v59 → v60 — Peak's Springless Silence is one damaging hit: the 0.5 % hit that
// preceded the 99.5 % hit needs the caster 2.5 m from the target after the dash,
// which never happens on a training stake. A Skill Editor copy seeded with both
// hits loses the first and keeps the second as `hit-0`. Only a copy whose two
// rows are still exactly the seeded ones is rewritten — once a value differs, a
// stale copy and a deliberate edit are indistinguishable.
import { matchesRow, type HitRow } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const TARGET_ID = "silkbindJade-fanspecial"

const CAST_TOTAL: HitRow = [1.2798, 1.9197, 355, 193]

const scaled = (row: HitRow, share: number): HitRow => [
  row[0] * share,
  row[1] * share,
  row[2] * share,
  row[3] * share,
]

const SMALL_HIT_ROW = scaled(CAST_TOTAL, 0.005)
const LANDING_HIT_ROW = scaled(CAST_TOTAL, 0.995)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== TARGET_ID) return skill
  if (!Array.isArray(skill.hits) || skill.hits.length !== 2) return skill
  const [smallHit, landingHit] = skill.hits as unknown[]
  if (!isRecord(smallHit) || !isRecord(landingHit)) return skill
  if (!matchesRow(smallHit, SMALL_HIT_ROW) || !matchesRow(landingHit, LANDING_HIT_ROW)) {
    return skill
  }
  return { ...skill, hits: [{ ...landingHit, id: "hit-0" }] }
}

export const V60__springlessSilenceLandingHitOnly: CustomSkillMigration = {
  to: 60,
  name: "V60__springlessSilenceLandingHitOnly",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 60, skills }
  },
}
