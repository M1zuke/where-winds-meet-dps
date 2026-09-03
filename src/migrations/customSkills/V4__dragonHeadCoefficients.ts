// v3 → v4 — Dragon Head and Dragon Head - Plus were re-authored with lower
// coefficients. A Skill Editor copy seeded before that still carries the old
// rows. Only a copy still identical to what was seeded is rewritten: once a
// value differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const SUPERSEDED_DRAGON_HEAD_HITS: Record<
  string,
  { from: [number, number, number]; to: [number, number, number] }
> = {
  "-dragon-head-plus": {
    from: [25.200406, 4695.46, 37.800609],
    to: [17.3793, 3237, 26.0689],
  },
  "-dragon-head": {
    from: [36.00058, 6707.8, 54.00087],
    to: [24.827571, 4624.285714, 37.241286],
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function migrateDragonHeadHits(id: string, hits: unknown): unknown {
  const suffix = id.endsWith("-dragon-head-plus") ? "-dragon-head-plus" : "-dragon-head"
  if (!id.endsWith(suffix) || !Array.isArray(hits)) return hits
  const swap = SUPERSEDED_DRAGON_HEAD_HITS[suffix]
  return hits.map((hit) => {
    if (!isRecord(hit)) return hit
    const untouched =
      hit.physMultiplier === swap.from[0] &&
      hit.physFixed === swap.from[1] &&
      hit.attributeMultiplier === swap.from[2]
    if (!untouched) return hit
    return {
      ...hit,
      physMultiplier: swap.to[0],
      physFixed: swap.to[1],
      attributeMultiplier: swap.to[2],
    }
  })
}

export const V4__dragonHeadCoefficients: CustomSkillMigration = {
  to: 4,
  name: "V4__dragonHeadCoefficients",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map((skill) =>
          isRecord(skill) && typeof skill.id === "string"
            ? { ...skill, hits: migrateDragonHeadHits(skill.id, skill.hits) }
            : skill,
        )
      : blob.skills
    return { ...blob, v: 4, skills }
  },
}
