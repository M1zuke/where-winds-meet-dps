// v69 → v70 — Cloudstep lands its hit on frame 25 and casts 36 f (were 29 and
// 43), Relentless Chase's third strike lands its first hit on frame 18 (was
// 19) and Sword Light Attack's stage 3 last hit on frame 87 (was 88). A Skill
// Editor copy seeded before this still carries the old values. Only a value
// still identical to what was seeded is rewritten: once it differs, a stale
// copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ValuePair {
  from: number
  to: number
}

interface Retiming {
  castFrames?: ValuePair
  hitFrames: readonly (ValuePair | null)[]
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const RETIMINGS: Readonly<Record<string, Retiming>> = {
  "bellstrikeSplendor-cloudstep": {
    castFrames: { from: 43, to: 36 },
    hitFrames: [{ from: 29, to: 25 }],
  },
  "bellstrikeSplendor-swordq-3rd": { hitFrames: [null, { from: 19, to: 18 }] },
  "bellstrikeSplendor-sword-light-attack": {
    hitFrames: [null, null, null, null, { from: 88, to: 87 }],
  },
}

const retimedHit = (hit: unknown, frames: ValuePair | null | undefined): unknown =>
  isRecord(hit) && frames && hit.frame === frames.from ? { ...hit, frame: frames.to } : hit

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const retiming = RETIMINGS[skill.id]
  if (!retiming) return skill
  const castFrames =
    retiming.castFrames && skill.castFrames === retiming.castFrames.from
      ? retiming.castFrames.to
      : skill.castFrames
  return {
    ...skill,
    castFrames,
    hits: skill.hits.map((hit, index) => retimedHit(hit, retiming.hitFrames[index])),
  }
}

export const V70__splendorHitFrameRetiming: CustomSkillMigration = {
  to: 70,
  name: "V70__splendorHitFrameRetiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 70, skills }
  },
}
