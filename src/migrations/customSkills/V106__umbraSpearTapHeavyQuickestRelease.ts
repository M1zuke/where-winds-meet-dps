// v105 → v106 — the Umbra spear tap heavy attack lands on frame 29.53 and ends
// its cast on frame 52.2 (was 43 and 66): the tap is released as soon as the
// button allows, not held through the whole 0.3 s window. A Skill Editor copy
// seeded before this still carries the earlier values. Only a value still
// identical to what was seeded is rewritten: once it differs, a stale copy and
// a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const SPEAR_HEAVY_1_ID = "bellstrikeUmbra-spear-heavy-1"
const HIT_FRAME = { from: 43, to: 29.53 }
const CAST_FRAMES = { from: 66, to: 52.2 }

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const retimed = (value: unknown, pair: { from: number; to: number }): unknown =>
  value === pair.from ? pair.to : value

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== SPEAR_HEAVY_1_ID || !Array.isArray(skill.hits)) return skill
  const [firstHit, ...otherHits] = skill.hits
  return {
    ...skill,
    castFrames: retimed(skill.castFrames, CAST_FRAMES),
    hits: isRecord(firstHit)
      ? [{ ...firstHit, frame: retimed(firstHit.frame, HIT_FRAME) }, ...otherHits]
      : skill.hits,
  }
}

export const V106__umbraSpearTapHeavyQuickestRelease: CustomSkillMigration = {
  to: 106,
  name: "V106__umbraSpearTapHeavyQuickestRelease",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 106, skills }
  },
}
