// The one predicate deciding whether a modifier reaches an entity. Both the
// engine (which applies the damage) and the Skill Editor's Receives card (which
// tells the user it was applied) go through it — two hand-mirrored copies is
// how the card starts claiming a buff the engine never applies.
import { hasAnyWeapon, hasProp } from "./buffs/tags"

export interface Scope {
  affects?: string[] | null
  affectsProperty?: string
  affectsWeaponTypes?: string[]
}

// Membership, not prefix: a scope entry names a tag the entity either declares
// or does not. Family coverage is expressed by the members carrying the family
// tag as well as their own, never by one name being a stem of another.
export function matchesScope(tagSet: ReadonlySet<string>, scope: Scope): boolean {
  if (scope.affectsProperty) return hasProp(tagSet, scope.affectsProperty)
  if (scope.affectsWeaponTypes) return hasAnyWeapon(tagSet, scope.affectsWeaponTypes)
  if (scope.affects === null || scope.affects === undefined) return true
  return scope.affects.some((tag) => tagSet.has(tag))
}

export function matchesAnyTag(tagSet: ReadonlySet<string>, tags: readonly string[]): boolean {
  return tags.some((tag) => tagSet.has(tag))
}
