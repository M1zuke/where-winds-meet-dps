// v111 → v112 — Blade Vessel's seven rapid slashes land 14 frames apart from
// frame 44 (were 8 apart from frame 42). A Skill Editor copy seeded before this
// still carries the old frames. Only frames still identical to what was seeded
// are rewritten: once they differ, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const BLADE_VESSEL_ID = "bamboocutDraught-blade-vessel"
const SEEDED_FRAMES = [42, 50, 58, 66, 74, 82, 90]
const CURRENT_FRAMES = [44, 58, 72, 86, 100, 114, 128]
const FIRST_SLASH_INDEX = 1

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== BLADE_VESSEL_ID || !Array.isArray(skill.hits)) return skill
  const slashes = skill.hits.slice(FIRST_SLASH_INDEX, FIRST_SLASH_INDEX + SEEDED_FRAMES.length)
  const seeded =
    slashes.length === SEEDED_FRAMES.length &&
    slashes.every((slash, index) => isRecord(slash) && slash.frame === SEEDED_FRAMES[index])
  if (!seeded) return skill
  const hits = skill.hits.map((hit: unknown, index: number) =>
    index >= FIRST_SLASH_INDEX && index < FIRST_SLASH_INDEX + CURRENT_FRAMES.length && isRecord(hit)
      ? { ...hit, frame: CURRENT_FRAMES[index - FIRST_SLASH_INDEX] }
      : hit,
  )
  return { ...skill, hits }
}

export const V112__bladeVesselRapidSlashSpacing: CustomSkillMigration = {
  to: 112,
  name: "V112__bladeVesselRapidSlashSpacing",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 112, skills }
  },
}
