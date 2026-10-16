// v101 → v102 — the pre-pull Vagrant Sword's single bolt launches on frame
// 12.14 (was 12) and the cast ends on frame 37.2 (was 37). A Skill Editor copy
// seeded before this still carries the earlier values. Only a value still
// identical to what was seeded is rewritten: once it differs, a stale copy and
// a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const PREPULL_ID = "bellstrikeSplendor-swordheavycharged-prepull"
const BOLT_FRAME = { from: 12, to: 12.14 }
const CAST_FRAMES = { from: 37, to: 37.2 }

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const retimed = (value: unknown, pair: { from: number; to: number }): unknown =>
  value === pair.from ? pair.to : value

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== PREPULL_ID || !Array.isArray(skill.hits)) return skill
  const [firstHit, ...otherHits] = skill.hits
  return {
    ...skill,
    castFrames: retimed(skill.castFrames, CAST_FRAMES),
    hits: isRecord(firstHit)
      ? [{ ...firstHit, frame: retimed(firstHit.frame, BOLT_FRAME) }, ...otherHits]
      : skill.hits,
  }
}

export const V102__prepullVagrantSwordBoltTiming: CustomSkillMigration = {
  to: 102,
  name: "V102__prepullVagrantSwordBoltTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 102, skills }
  },
}
