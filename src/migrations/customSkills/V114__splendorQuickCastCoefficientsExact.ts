// v113 → v114 — Daunting Strike, Qiankun's Lock and the Relentless Chase strikes
// carry their exact products of the numerical row, not roundings. A Skill Editor
// copy seeded before this still carries the rounded rows. Only a row still
// identical to what was seeded is rewritten: once a value differs, a stale copy
// and a deliberate edit are indistinguishable.
import { swapMatchingRows, type RowSwap } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const SPLENDOR_SKILL_ID_PREFIX = "bellstrikeSplendor-"

const ROW_SWAPS: readonly RowSwap[] = [
  { from: [1.0253, 1.538, 283.6, 154.6], to: [1.025314, 1.537971, 283.6, 154.6] },
  { from: [0.5732, 0.8598, 160, 87], to: [0.57317, 0.859755, 160, 87] },
  { from: [0.768985, 1.153478, 212.7, 115.95], to: [0.7689855, 1.15347825, 212.7, 115.95] },
]

export const healSkill = (skill: unknown): unknown =>
  swapMatchingRows(skill, SPLENDOR_SKILL_ID_PREFIX, ROW_SWAPS)

export const V114__splendorQuickCastCoefficientsExact: CustomSkillMigration = {
  to: 114,
  name: "V114__splendorQuickCastCoefficientsExact",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 114, skills }
  },
}
