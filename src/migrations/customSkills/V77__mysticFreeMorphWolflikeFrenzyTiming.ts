// v76 → v77 — Free Morph lands its hits on frames 24 / 58 / 79 / 100 / 115 /
// 126 / 170 and casts 270 f (were 25 / 59 / 80 / 101 / 115 / 126 / 171 and
// 171), Wolflike Frenzy lands its finisher on frame 155 and casts 218 f (were
// 167 and 167). A Skill Editor copy seeded before this still carries the old
// values. Only a value still identical to what was seeded is rewritten: once
// it differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ValuePair {
  from: number
  to: number
}

interface Retiming {
  castFrames: ValuePair
  hitFrames: readonly (ValuePair | null)[]
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const RETIMINGS_BY_ID_SUFFIX: Readonly<Record<string, Retiming>> = {
  "-free-morph": {
    castFrames: { from: 171, to: 270 },
    hitFrames: [
      { from: 25, to: 24 },
      { from: 59, to: 58 },
      { from: 80, to: 79 },
      { from: 101, to: 100 },
      null,
      null,
      { from: 171, to: 170 },
    ],
  },
  "-wolflike-frenzy": {
    castFrames: { from: 167, to: 218 },
    hitFrames: [null, null, null, null, null, { from: 167, to: 155 }],
  },
}

const retimed = (value: unknown, pair: ValuePair | null | undefined): unknown =>
  pair && value === pair.from ? pair.to : value

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const id = skill.id
  const suffix = Object.keys(RETIMINGS_BY_ID_SUFFIX).find((candidate) => id.endsWith(candidate))
  if (!suffix) return skill
  const retiming = RETIMINGS_BY_ID_SUFFIX[suffix]!
  return {
    ...skill,
    castFrames: retimed(skill.castFrames, retiming.castFrames),
    hits: skill.hits.map((hit, index) =>
      isRecord(hit) ? { ...hit, frame: retimed(hit.frame, retiming.hitFrames[index]) } : hit,
    ),
  }
}

export const V77__mysticFreeMorphWolflikeFrenzyTiming: CustomSkillMigration = {
  to: 77,
  name: "V77__mysticFreeMorphWolflikeFrenzyTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 77, skills }
  },
}
