import type { Skill } from "../skill"

export const PROP_TAG = "prop:"
export const WEAPON_TAG = "weapon:"
export const MYSTIC_TAG = "mystic:"
export const ATTUNE_TAG = "attune:"

export function skillTagsOf(skill: Skill): Set<string> {
  const t = new Set<string>(skill.tags ?? [])
  if (skill.skillType) t.add(skill.skillType)
  if (skill.weaponOrAttribute) t.add(skill.weaponOrAttribute)
  if (skill.attributeAttack) t.add(skill.attributeAttack)
  if (skill.name) t.add(skill.name)
  return t
}

export function castTagOf(skill: Skill): string {
  return skill.name ?? ""
}

export function tagStartsWith(castTag: string, prefix: string): boolean {
  return castTag.startsWith(prefix)
}

export function anyTagStartsWith(tagSet: Set<string>, prefixes: readonly string[]): boolean {
  for (const p of prefixes) for (const tag of tagSet) if (tag.startsWith(p)) return true
  return false
}

export function hasProp(tagSet: Set<string>, prop: string): boolean {
  return tagSet.has(PROP_TAG + prop)
}

export function hasAnyWeapon(tagSet: Set<string>, weapons: readonly string[]): boolean {
  for (const w of weapons) if (tagSet.has(WEAPON_TAG + w)) return true
  return false
}

export function mysticCategoryOf(skill: Pick<Skill, "tags">): string {
  const tag = (skill.tags ?? []).find((t) => t.startsWith(MYSTIC_TAG))
  return tag ? tag.slice(MYSTIC_TAG.length) : ""
}

// Returns the whole tag, not its suffix — `FormulaContext.attuneBoostByTag` is
// keyed by the tag as authored so the scope reads the same in data and in code.
export function attuneTagOf(skill: Pick<Skill, "tags">): string {
  return (skill.tags ?? []).find((t) => t.startsWith(ATTUNE_TAG)) ?? ""
}
