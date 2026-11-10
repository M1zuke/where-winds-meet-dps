// v117 → v118 — a follower of higher priority than the umbrella throw breaks it
// from the frame the umbrella attaches, 36, instead of waiting for the recovery
// at 65.58 frames. A Skill Editor copy of the throw seeded before this lacks the
// zero-damage hit that carries that follow-up gate. Only a copy still holding
// its single hit and its seeded cast length is extended: once they differ, a
// stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const LAUNCH_IDS: ReadonlySet<string> = new Set([
  "silkbindJade-umbdronelaunch",
  "silkbindJade-umbdronelaunch-12hit",
  "silkbindJade-umbdronelaunch-16hit",
  "silkbindJade-umbdronelaunch-20hit",
  "silkbindJade-umbdronelaunch-23hit",
  "silkbindJade-umbdronelaunch-26hit",
])

const SEEDED_CAST_FRAMES = 65.58
const HIGHER_PRIORITY_FOLLOW_UPS = [
  "silkbindJade-fanspecial",
  "silkbindJade-fanspecial-return",
  "silkbindJade-fanq",
  "silkbindJade-fanqcancel",
  "silkbindJade-fanheavypursuit-3-hit",
  "silkbindJade-fanheavypursuit-5-hit",
  "silkbindJade-bamboo-breeze",
  "universal-deflect-cancel",
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !LAUNCH_IDS.has(skill.id)) return skill
  if (skill.castFrames !== SEEDED_CAST_FRAMES) return skill
  if (!Array.isArray(skill.hits) || skill.hits.length !== 1) return skill
  return {
    ...skill,
    hits: [
      ...skill.hits,
      {
        id: "hit-1",
        frame: 36,
        physMultiplier: 0,
        attributeMultiplier: 0,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: [],
        requiresNextStepSkillIds: [...HIGHER_PRIORITY_FOLLOW_UPS],
        castFramesWhenGated: 36,
      },
    ],
  }
}

export const V118__jadeLaunchBrokenByHigherPriority: CustomSkillMigration = {
  to: 118,
  name: "V118__jadeLaunchBrokenByHigherPriority",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 118, skills }
  },
}
