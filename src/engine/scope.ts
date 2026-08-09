// The one predicate deciding whether a modifier reaches an entity. Both the
// engine (which applies the damage) and the Skill Editor's Receives card (which
// tells the user it was applied) go through it — two hand-mirrored copies is
// how the card starts claiming a buff the engine never applies.
import { anyTagStartsWith, hasAnyWeapon, hasProp } from "./buffs/tags"

export interface Scope {
  affects?: string[] | null
  affectsProperty?: string
  affectsWeaponTypes?: string[]
}

export function matchesScope(tagSet: Set<string>, scope: Scope): boolean {
  if (scope.affectsProperty) return hasProp(tagSet, scope.affectsProperty)
  if (scope.affectsWeaponTypes) return hasAnyWeapon(tagSet, scope.affectsWeaponTypes)
  if (scope.affects === null || scope.affects === undefined) return true
  return scope.affects.length > 0 && anyTagStartsWith(tagSet, scope.affects)
}
