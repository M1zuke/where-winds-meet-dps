// v123 → v124 — Dragon Head's hit lands 281.62 frames into the cast (Plus:
// 281.52) and the cast blocks the next skill until frame 348, not the 246
// both carried. A Skill Editor copy seeded before this holds the 246 frame hit
// and the 246 frame cast. Only a copy still holding both is rewritten: once
// either differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const SEEDED_FRAMES = 246
const HEALED_CAST_FRAMES = 348
const HEALED_HIT_FRAME_BY_SUFFIX: readonly (readonly [suffix: string, frame: number])[] = [
  ["-dragon-head-plus", 281.52],
  ["-dragon-head", 281.62],
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const healedFrame = HEALED_HIT_FRAME_BY_SUFFIX.find(([suffix]) =>
    (skill.id as string).endsWith(suffix),
  )?.[1]
  if (healedFrame === undefined || skill.castFrames !== SEEDED_FRAMES) return skill
  if (!Array.isArray(skill.hits) || skill.hits.length !== 1) return skill
  const [hit] = skill.hits
  if (!isRecord(hit) || hit.frame !== SEEDED_FRAMES) return skill
  return { ...skill, castFrames: HEALED_CAST_FRAMES, hits: [{ ...hit, frame: healedFrame }] }
}

export const V124__dragonHeadCastLength: CustomSkillMigration = {
  to: 124,
  name: "V124__dragonHeadCastLength",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 124, skills }
  },
}
