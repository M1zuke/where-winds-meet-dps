// v71 → v72 — Fleeting Trace lands its hits on frames 51, 73, 79, 85, 91, 109,
// 113, 117 and its last hit on 121 (were 38, 60, 66, 72, 78, 96, 100, 104 and
// 108); the Heng Blade and Mo Blade dashes land on frame 24 (were 22 and 25).
// A Skill Editor copy seeded before this still carries the old frames. Only a
// frame still identical to what was seeded is rewritten: once it differs, a
// stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ValuePair {
  from: number
  to: number
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const pair = (from: number, to: number): ValuePair => ({ from, to })

const HIT_RETIMINGS: Readonly<Record<string, readonly ValuePair[]>> = {
  "stonesplitStrength-snowpartingspecial": [
    pair(38, 51),
    pair(60, 73),
    pair(66, 79),
    pair(72, 85),
    pair(78, 91),
    pair(96, 109),
    pair(100, 113),
    pair(104, 117),
    pair(108, 121),
  ],
  "stonesplitStrength-heng-dash": [pair(22, 24)],
  "stonesplitStrength-mo-dash": [pair(25, 24)],
}

const retimedHit = (hit: unknown, frames: ValuePair | undefined): unknown =>
  isRecord(hit) && frames && hit.frame === frames.from ? { ...hit, frame: frames.to } : hit

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const retiming = HIT_RETIMINGS[skill.id]
  if (!retiming) return skill
  return { ...skill, hits: skill.hits.map((hit, index) => retimedHit(hit, retiming[index])) }
}

export const V72__stonesplitHitFrameRetiming: CustomSkillMigration = {
  to: 72,
  name: "V72__stonesplitHitFrameRetiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 72, skills }
  },
}
