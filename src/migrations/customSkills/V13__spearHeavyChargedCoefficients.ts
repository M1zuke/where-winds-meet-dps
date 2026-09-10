// v12 → v13 — the spear Charged Skill's five hits carried the Special
// Skill's figures spread flat across them instead of their own, much larger,
// unevenly-weighted rows. A Skill Editor copy seeded before that fix still
// holds the flat row on every hit it was seeded with.
import { swapHits, swapSkillHits, type HitRow, type HitSwap } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const FIVE_HIT_OLD: HitRow = [0.30346, 0.45518000000000003, 70.2, 39.2]
const ONE_HIT_OLD: HitRow = [0.30346, 0.45518, 70.2, 39.2]
const FIRST_AND_FOURTH: HitRow = [1.250878, 1.876317, 346, 188.6]
const SECOND: HitRow = [0.750527, 1.12579, 207.6, 113.16]
const THIRD: HitRow = [0.375263, 0.562895, 103.8, 56.58]
const FIFTH: HitRow = [0.331483, 0.497224, 91.69, 49.98]

const SUPERSEDED_SPEAR_HEAVY_HITS: Record<string, readonly HitSwap[]> = {
  "bellstrikeUmbra-spearheavy": [
    { from: FIVE_HIT_OLD, to: FIRST_AND_FOURTH },
    { from: FIVE_HIT_OLD, to: SECOND },
    { from: FIVE_HIT_OLD, to: THIRD },
    { from: FIVE_HIT_OLD, to: FIRST_AND_FOURTH },
    { from: FIVE_HIT_OLD, to: FIFTH },
  ],
  "bellstrikeUmbra-spearheavy-1-hit": [{ from: ONE_HIT_OLD, to: FIRST_AND_FOURTH }],
  "bellstrikeUmbra-spearheavy-1-hit-prepull": [{ from: ONE_HIT_OLD, to: FIRST_AND_FOURTH }],
}

export function spearHeavyHitSwapsFor(skillId: string): readonly HitSwap[] | undefined {
  return SUPERSEDED_SPEAR_HEAVY_HITS[skillId]
}

export function healSpearHeavyChargedCoefficients(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const swaps = spearHeavyHitSwapsFor(skill.id)
  return swaps ? { ...skill, hits: swapHits(skill.hits, swaps) } : skill
}

export const V13__spearHeavyChargedCoefficients: CustomSkillMigration = {
  to: 13,
  name: "V13__spearHeavyChargedCoefficients",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    return { ...blob, v: 13, skills: swapSkillHits(blob, spearHeavyHitSwapsFor) }
  },
}
