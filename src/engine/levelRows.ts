import {
  BREAKTHROUGH_TIERS,
  levelRowsCover,
  levelSelectionFor,
  type LevelSelection,
} from "../definitions/baseStats/breakthroughs"
import type { Debuff } from "./debuff"
import type { CoefficientRow, LevelRows, Skill, SkillHit } from "./skill"

type Scaled = CoefficientRow & { levelRows?: LevelRows }

function keyOf(levelRows: LevelRows, selection: LevelSelection): string {
  return String(levelRows.scale === "artLevel" ? selection.artLevel : selection.mysticTier)
}

export function rowAt(levelRows: LevelRows, selection: LevelSelection): CoefficientRow | null {
  return levelRows.rows[keyOf(levelRows, selection)] ?? null
}

export function rowAtLevel<T extends Scaled>(row: T, selection: LevelSelection): T {
  if (!row.levelRows) return row
  const found = rowAt(row.levelRows, selection)
  if (!found) return row
  const { physMultiplier, attributeMultiplier, physFixed, attributeFixed } = found
  if (
    row.physMultiplier === physMultiplier &&
    row.attributeMultiplier === attributeMultiplier &&
    row.physFixed === physFixed &&
    row.attributeFixed === attributeFixed
  ) {
    return row
  }
  return { ...row, physMultiplier, attributeMultiplier, physFixed, attributeFixed }
}

export function frozenAtLevel<T extends Scaled>(
  row: T,
  selection: LevelSelection,
): Omit<T, "levelRows"> {
  const { levelRows: _levelRows, ...resolved } = rowAtLevel(row, selection)
  return resolved
}

function selectionKey(selection: LevelSelection): string {
  return `${selection.artLevel}/${selection.mysticTier}`
}

function memoised<T extends object>(
  cache: WeakMap<T, Map<string, T>>,
  source: T,
  selection: LevelSelection,
  resolve: () => T,
): T {
  const key = selectionKey(selection)
  let perSelection = cache.get(source)
  if (!perSelection) {
    perSelection = new Map()
    cache.set(source, perSelection)
  }
  const cached = perSelection.get(key)
  if (cached) return cached
  const resolved = resolve()
  perSelection.set(key, resolved)
  return resolved
}

function hitAtLevel(hit: SkillHit, selection: LevelSelection): SkillHit {
  const own = rowAtLevel(hit, selection)
  let variantsChanged = false
  const variants = hit.variants?.map((variant) => {
    const resolved = rowAtLevel(variant, selection)
    if (resolved !== variant) variantsChanged = true
    return resolved
  })
  if (own === hit && !variantsChanged) return hit
  return variantsChanged ? { ...own, variants } : own
}

const skillCache = new WeakMap<Skill, Map<string, Skill>>()

export function skillAtLevel(skill: Skill, selection: LevelSelection): Skill {
  return memoised(skillCache, skill, selection, () => {
    let changed = false
    const hits = skill.hits.map((hit) => {
      const resolved = hitAtLevel(hit, selection)
      if (resolved !== hit) changed = true
      return resolved
    })
    return changed ? { ...skill, hits } : skill
  })
}

const debuffCache = new WeakMap<Debuff, Map<string, Debuff>>()

export function debuffAtLevel(debuff: Debuff, selection: LevelSelection): Debuff {
  return memoised(debuffCache, debuff, selection, () => {
    if (!debuff.dot) return debuff
    const dot = rowAtLevel(debuff.dot, selection)
    return dot === debuff.dot ? debuff : { ...debuff, dot }
  })
}

function levelRowsOf(skill: Skill): LevelRows[] {
  const found: LevelRows[] = []
  for (const hit of skill.hits) {
    if (hit.levelRows) found.push(hit.levelRows)
    for (const variant of hit.variants ?? []) {
      if (variant.levelRows) found.push(variant.levelRows)
    }
  }
  return found
}

function levelRowsFloor(skill: Skill, breakthrough: number): number | null {
  const scaled = levelRowsOf(skill)
  const selection = levelSelectionFor(breakthrough)
  if (scaled.every((levelRows) => levelRowsCover(levelRows, selection))) return null
  const covering = BREAKTHROUGH_TIERS.find((tier) =>
    scaled.every((levelRows) =>
      levelRowsCover(levelRows, { artLevel: tier.artLevel, mysticTier: tier.mysticTier }),
    ),
  )
  return covering ? covering.breakthrough : null
}

export function breakthroughFloor(skill: Skill, breakthrough: number): number | null {
  const declared =
    skill.minBreakthrough !== undefined && breakthrough < skill.minBreakthrough
      ? skill.minBreakthrough
      : null
  const fromLevelRows = levelRowsFloor(skill, breakthrough)
  if (declared === null) return fromLevelRows
  return fromLevelRows === null ? declared : Math.max(declared, fromLevelRows)
}
