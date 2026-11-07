// v21 → v22 — Dragon Head, Dragon Head - Plus, Dragon's Breath: Smolder and
// the Bitter Season tick were re-authored to their in-game coefficients. A
// Skill Editor copy seeded before that still carries the old rows. Only a
// copy still identical to what was seeded is rewritten: once a value
// differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

interface CoefficientRow {
  physMultiplier: number
  physFixed: number
  attributeMultiplier: number
}

interface SkillCoefficientSwap {
  idSuffix: string
  from: CoefficientRow
  to: CoefficientRow
}

const SWAPS: readonly SkillCoefficientSwap[] = [
  {
    idSuffix: "-dragon-head-plus",
    from: { physMultiplier: 17.34049, physFixed: 2608.52, attributeMultiplier: 26.010735 },
    to: { physMultiplier: 12.59654, physFixed: 1912.3, attributeMultiplier: 18.89481 },
  },
  {
    idSuffix: "-dragon-head",
    from: { physMultiplier: 24.77213, physFixed: 3726.46, attributeMultiplier: 37.158195 },
    to: { physMultiplier: 19.07454, physFixed: 2869.37, attributeMultiplier: 28.61181 },
  },
  {
    idSuffix: "-dragon-fire-smolder-1-hit",
    from: { physMultiplier: 1.36064, physFixed: 205.5, attributeMultiplier: 2.04096 },
    to: { physMultiplier: 1.28367, physFixed: 195.71, attributeMultiplier: 1.925505 },
  },
  {
    idSuffix: "-dragon-fire-smolder-2-hits",
    from: { physMultiplier: 1.40692, physFixed: 212.49, attributeMultiplier: 2.11038 },
    to: { physMultiplier: 1.32733, physFixed: 202.37, attributeMultiplier: 1.990995 },
  },
  {
    idSuffix: "-bitter-season-tick",
    from: { physMultiplier: 0.15, physFixed: 0, attributeMultiplier: 0.225 },
    to: { physMultiplier: 0.02, physFixed: 0, attributeMultiplier: 0 },
  },
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function coefficientsMatch(hit: Record<string, unknown>, row: CoefficientRow): boolean {
  return (
    hit.physMultiplier === row.physMultiplier &&
    hit.physFixed === row.physFixed &&
    hit.attributeMultiplier === row.attributeMultiplier
  )
}

export function recalibrateSharedMysticHits(id: string, hits: unknown): unknown {
  if (!Array.isArray(hits)) return hits
  const swap = SWAPS.find((candidate) => id.endsWith(candidate.idSuffix))
  if (!swap) return hits
  return hits.map((hit) =>
    isRecord(hit) && coefficientsMatch(hit, swap.from) ? { ...hit, ...swap.to } : hit,
  )
}

export const V22__sharedMysticCoefficients: CustomSkillMigration = {
  to: 22,
  name: "V22__sharedMysticCoefficients",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map((skill) =>
          isRecord(skill) && typeof skill.id === "string"
            ? { ...skill, hits: recalibrateSharedMysticHits(skill.id, skill.hits) }
            : skill,
        )
      : blob.skills
    return { ...blob, v: 22, skills }
  },
}
