// v68 → v69 — Spear Light Attack stage 3 lands its hits on frames 18 and 35
// (were 14 and 31), and the second hit of Sword Light Attack stage 3, both
// forms, on frame 20 (was 21). A Skill Editor copy seeded before this still
// carries the old frames. Only a frame still identical to what was seeded is
// rewritten: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface FramePair {
  from: number
  to: number
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SWORD_SECOND_HIT: readonly (FramePair | null)[] = [null, { from: 21, to: 20 }]

const RETIMINGS: Readonly<Record<string, readonly (FramePair | null)[]>> = {
  "bellstrikeUmbra-spear-light-3": [
    { from: 14, to: 18 },
    { from: 31, to: 35 },
  ],
  "bellstrikeUmbra-sword-light-3": SWORD_SECOND_HIT,
  "bellstrikeUmbra-sword-light-3-ends-chain": SWORD_SECOND_HIT,
}

const retimedHit = (hit: unknown, frames: FramePair | null | undefined): unknown =>
  isRecord(hit) && frames && hit.frame === frames.from ? { ...hit, frame: frames.to } : hit

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const frames = RETIMINGS[skill.id]
  if (!frames) return skill
  return { ...skill, hits: skill.hits.map((hit, index) => retimedHit(hit, frames[index])) }
}

export const V69__lightAttackThreeHitFrames: CustomSkillMigration = {
  to: 69,
  name: "V69__lightAttackThreeHitFrames",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 69, skills }
  },
}
