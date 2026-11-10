import type { RawCustomSkillsBlob } from "./types"

export type HitRow = readonly [
  phys: number,
  attribute: number,
  physFlat: number,
  attributeFlat: number,
]

export interface RowSwap {
  from: HitRow
  to: HitRow
}

export interface HitSwap extends RowSwap {
  variants?: readonly RowSwap[]
}

type RowLike = Record<string, unknown>

const isRecord = (value: unknown): value is RowLike =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function matchesRow(row: RowLike, expected: HitRow): boolean {
  return (
    row.physMultiplier === expected[0] &&
    row.attributeMultiplier === expected[1] &&
    row.physFixed === expected[2] &&
    row.attributeFixed === expected[3]
  )
}

export function withRow(row: RowLike, next: HitRow): RowLike {
  return {
    ...row,
    physMultiplier: next[0],
    attributeMultiplier: next[1],
    physFixed: next[2],
    attributeFixed: next[3],
  }
}

// Only a row still identical to what was seeded is rewritten: once a value
// differs, a stale copy and a deliberate edit are indistinguishable.
export function swapHits(hits: unknown, swaps: readonly HitSwap[]): unknown {
  if (!Array.isArray(hits)) return hits
  return hits.map((hit, index) => {
    const swap = swaps[index]
    if (!swap || !isRecord(hit)) return hit
    const healed = matchesRow(hit, swap.from) ? withRow(hit, swap.to) : hit
    if (!swap.variants || !Array.isArray(hit.variants)) return healed
    const variants = hit.variants.map((variant) => {
      if (!isRecord(variant)) return variant
      const match = swap.variants!.find((candidate) => matchesRow(variant, candidate.from))
      return match ? withRow(variant, match.to) : variant
    })
    return { ...healed, variants }
  })
}

export function swapSkillHits(
  blob: RawCustomSkillsBlob,
  swapsFor: (skillId: string) => readonly HitSwap[] | undefined,
): unknown[] {
  if (!Array.isArray(blob.skills)) return blob.skills
  return blob.skills.map((skill) => {
    if (!isRecord(skill) || typeof skill.id !== "string") return skill
    const swaps = swapsFor(skill.id)
    return swaps ? { ...skill, hits: swapHits(skill.hits, swaps) } : skill
  })
}

// Every hit and every hit variant still carrying one of the swaps' old rows
// takes its new row; nothing else in the skill moves.
export function swapMatchingRows(
  skill: unknown,
  idPrefix: string,
  swaps: readonly RowSwap[],
): unknown {
  if (
    !isRecord(skill) ||
    typeof skill.id !== "string" ||
    !skill.id.startsWith(idPrefix) ||
    !Array.isArray(skill.hits)
  )
    return skill
  const swapRow = (row: RowLike): RowLike => {
    const swap = swaps.find((candidate) => matchesRow(row, candidate.from))
    return swap ? withRow(row, swap.to) : row
  }
  const hits = skill.hits.map((hit: unknown) => {
    if (!isRecord(hit)) return hit
    const swapped = swapRow(hit)
    return Array.isArray(hit.variants)
      ? {
          ...swapped,
          variants: hit.variants.map((variant: unknown) =>
            isRecord(variant) ? swapRow(variant) : variant,
          ),
        }
      : swapped
  })
  return { ...skill, hits }
}
