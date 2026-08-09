import type { Skill } from "../skill"

export const PROP_TAG = "prop:"
export const WEAPON_TAG = "weapon:"
export const MYSTIC_TAG = "mystic:"
export const ATTUNE_TAG = "attune:"
export const TYPE_TAG = "type:"
export const ROLE_TAG = "role:"
export const CAST_TAG = "cast:"

// Namespaced tags only. The display name, and the bare `skillType` /
// `weaponOrAttribute` / `attributeAttack` values, used to land here too, which
// is what let a modifier reach a skill by what it was called.
export function skillTagsOf(skill: Skill): Set<string> {
  const t = new Set<string>(skill.tags ?? [])
  if (skill.skillType) t.add(TYPE_TAG + skill.skillType)
  return t
}

// Built-ins author their cast tag, so renaming one is only a rename. A
// user-authored skill has none, and falls back to the tag its name derives —
// which is how a custom skill named after a built-in keeps triggering the same
// buffs as before.
export function deriveCastTag(name: string): string {
  const words = name
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
  if (words.length === 0 || words[0] === "") return ""
  return (
    CAST_TAG +
    words
      .map((word, index) =>
        index === 0
          ? word.charAt(0).toLowerCase() + word.slice(1)
          : word.charAt(0).toUpperCase() + word.slice(1),
      )
      .join("")
  )
}

export function castTagOf(skill: Pick<Skill, "castTag" | "name">): string {
  return skill.castTag ?? deriveCastTag(skill.name ?? "")
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
