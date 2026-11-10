// v118 → v119 — the umbrella dual-weapon skill is two bullets of half the row
// each, launched 20.18 and 26.18 frames into a 46.36 frame cast, not a hit at 12
// frames and a double share at 18. A Skill Editor copy seeded before this
// carries the old hits and cast length. A copy is rewritten only while its hits
// and cast length still equal what was seeded: once they differ, a stale copy
// and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const UMBRELLA_DUAL_ID = "silkbindJade-umbrella-dual"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, entry) =>
    isRecord(entry)
      ? Object.fromEntries(
          Object.entries(entry).sort(([left], [right]) => left.localeCompare(right)),
        )
      : entry,
  )

const HALF_ROW = {
  physMultiplier: 0.31677,
  attributeMultiplier: 0.475155,
  physFixed: 88,
  attributeFixed: 48,
  extraCritDamage: 1,
}

const SEEDED_HITS = [
  { id: "hit-0", frame: 12, ...HALF_ROW, triggers: [] },
  {
    id: "hit-1",
    frame: 18,
    physMultiplier: HALF_ROW.physMultiplier * 2,
    attributeMultiplier: HALF_ROW.attributeMultiplier * 2,
    physFixed: HALF_ROW.physFixed * 2,
    attributeFixed: HALF_ROW.attributeFixed * 2,
    extraCritDamage: 1,
    triggers: [],
  },
]

const BULLET_PROJECTILE = {
  speedMetersPerSecond: 50,
  acceleration: { initialSpeedMetersPerSecond: 20, metersPerSecondSquared: 90 },
  maxTravelFrames: 120,
}

const HEALED_HITS = [
  { id: "hit-0", frame: 20.18, ...HALF_ROW, triggers: [], projectile: BULLET_PROJECTILE },
  { id: "hit-1", frame: 26.18, ...HALF_ROW, triggers: [], projectile: BULLET_PROJECTILE },
]

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== UMBRELLA_DUAL_ID) return skill
  if (skill.castFrames !== 46 || canonical(skill.hits) !== canonical(SEEDED_HITS)) return skill
  return { ...skill, castFrames: 46.36, hits: HEALED_HITS.map((hit) => ({ ...hit })) }
}

export const V119__umbrellaDualTwoBullets: CustomSkillMigration = {
  to: 119,
  name: "V119__umbrellaDualTwoBullets",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 119, skills }
  },
}
