// v112 → v113 — the three Vagrant Sword waves carry their exact products of the
// level-2 bolt (0.4 / 0.48 / 0.56 of 3.2664 and its attribute twin), not the
// four-decimal roundings. A Skill Editor copy seeded before this still carries
// the rounded rows. Only a row still identical to what was seeded is rewritten:
// once a value differs, a stale copy and a deliberate edit are indistinguishable.
import { swapMatchingRows, type RowSwap } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const SPLENDOR_SKILL_ID_PREFIX = "bellstrikeSplendor-"

const WAVE_SWAPS: readonly RowSwap[] = [
  { from: [1.3066, 1.9598, 361.6, 197.2], to: [1.30656, 1.95984, 361.6, 197.2] },
  { from: [1.5679, 2.3518, 433.92, 236.64], to: [1.567872, 2.351808, 433.92, 236.64] },
  { from: [1.8292, 2.7438, 506.24, 276.08], to: [1.829184, 2.743776, 506.24, 276.08] },
]

export const healSkill = (skill: unknown): unknown =>
  swapMatchingRows(skill, SPLENDOR_SKILL_ID_PREFIX, WAVE_SWAPS)

export const V113__splendorWaveCoefficientsExact: CustomSkillMigration = {
  to: 113,
  name: "V113__splendorWaveCoefficientsExact",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 113, skills }
  },
}
