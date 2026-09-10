// v6 → v7 — every mystic art's damage row was re-authored to the values it has
// at the highest currently reachable rank. A Skill Editor copy seeded before
// that still carries the old row. Only a copy still identical to what was
// seeded is rewritten: once a value differs, a stale copy and a deliberate
// edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

interface CoefficientRow {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
}

interface CoefficientSwap {
  from: CoefficientRow
  to: CoefficientRow
}

const MYSTIC_ART_RANK_SWAPS: Record<string, CoefficientSwap> = {
  "-poet1": {
    from: { physMultiplier: 1.0238, attributeMultiplier: 1.5357, physFixed: 189 },
    to: { physMultiplier: 1.02325, attributeMultiplier: 1.534875, physFixed: 153.82 },
  },
  "-poet2": {
    from: { physMultiplier: 1.0238, attributeMultiplier: 1.5357, physFixed: 189 },
    to: { physMultiplier: 1.02325, attributeMultiplier: 1.534875, physFixed: 153.82 },
  },
  "-poet3": {
    from: { physMultiplier: 1.0238, attributeMultiplier: 1.5357, physFixed: 189 },
    to: { physMultiplier: 1.02325, attributeMultiplier: 1.534875, physFixed: 153.82 },
  },
  "-poet4": {
    from: { physMultiplier: 1.0238, attributeMultiplier: 1.5357, physFixed: 189 },
    to: { physMultiplier: 1.02325, attributeMultiplier: 1.534875, physFixed: 153.82 },
  },
  "-poet-final-hit-cancel": {
    from: { physMultiplier: 1.7063, attributeMultiplier: 2.55945, physFixed: 315 },
    to: { physMultiplier: 1.70541, attributeMultiplier: 2.558115, physFixed: 256.37 },
  },
  "-flute-of-the-tides-full": {
    from: { physMultiplier: 3.897, attributeMultiplier: 5.8454999999999995, physFixed: 800 },
    to: { physMultiplier: 3.93721, attributeMultiplier: 5.905815, physFixed: 855.92 },
  },
  "-fire-breath-1-hit": {
    from: { physMultiplier: 1.36185, attributeMultiplier: 2.042775, physFixed: 254 },
    to: { physMultiplier: 1.36064, attributeMultiplier: 2.04096, physFixed: 205.5 },
  },
  "-fire-breath-1-hit-prepull": {
    from: { physMultiplier: 1.36185, attributeMultiplier: 2.042775, physFixed: 254 },
    to: { physMultiplier: 1.36064, attributeMultiplier: 2.04096, physFixed: 205.5 },
  },
  "-fire-breath-2-hit": {
    from: {
      physMultiplier: 1.4081666666666666,
      attributeMultiplier: 2.11225,
      physFixed: 262.6666666666667,
    },
    to: { physMultiplier: 1.40692, attributeMultiplier: 2.11038, physFixed: 212.49 },
  },
  "-dragon-head-plus": {
    from: { physMultiplier: 17.3793, attributeMultiplier: 26.0689, physFixed: 3237 },
    to: { physMultiplier: 17.34049, attributeMultiplier: 26.010735, physFixed: 2608.52 },
  },
  "-dragon-head": {
    from: { physMultiplier: 24.827571, attributeMultiplier: 37.241286, physFixed: 4624.285714 },
    to: { physMultiplier: 24.77213, attributeMultiplier: 37.158195, physFixed: 3726.46 },
  },
  "-soaring": {
    from: { physMultiplier: 3.5537, attributeMultiplier: 5.3298, physFixed: 660 },
    to: { physMultiplier: 3.55121, attributeMultiplier: 5.326815, physFixed: 535.03 },
  },
  "-soaring-1-hit": {
    from: { physMultiplier: 3.1951, attributeMultiplier: 4.7927, physFixed: 432 },
    to: { physMultiplier: 3.19609, attributeMultiplier: 4.794135, physFixed: 481.53 },
  },
  "-toad-cancel": {
    from: { physMultiplier: 1.89185, attributeMultiplier: 2.8378, physFixed: 255.5 },
    to: { physMultiplier: 1.8922, attributeMultiplier: 2.8383, physFixed: 284.31 },
  },
  "-dragon-fire-smolder-1-hit": {
    from: { physMultiplier: 1.2848, attributeMultiplier: 1.9272, physFixed: 241.5 },
    to: { physMultiplier: 1.36064, attributeMultiplier: 2.04096, physFixed: 205.5 },
  },
  "-dragon-fire-smolder-2-hits": {
    from: {
      physMultiplier: 1.3285,
      attributeMultiplier: 1.99275,
      physFixed: 249.66666666666666,
    },
    to: { physMultiplier: 1.40692, attributeMultiplier: 2.11038, physFixed: 212.49 },
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function swapForId(id: string): CoefficientSwap | undefined {
  for (const [suffix, swap] of Object.entries(MYSTIC_ART_RANK_SWAPS)) {
    if (id.endsWith(suffix)) return swap
  }
  return undefined
}

export function healMysticArtRank(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const swap = swapForId(skill.id)
  if (!swap) return skill
  const hits = skill.hits.map((hit) => {
    if (!isRecord(hit)) return hit
    const untouched =
      hit.physMultiplier === swap.from.physMultiplier &&
      hit.attributeMultiplier === swap.from.attributeMultiplier &&
      hit.physFixed === swap.from.physFixed
    return untouched ? { ...hit, ...swap.to } : hit
  })
  return { ...skill, hits }
}

export const V7__mysticArtRankRepair: CustomSkillMigration = {
  to: 7,
  name: "V7__mysticArtRankRepair",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healMysticArtRank) : blob.skills
    return { ...blob, v: 7, skills }
  },
}
