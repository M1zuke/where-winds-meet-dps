// `reaches` is the one predicate deciding whether a modifier reaches an
// entity. Both the engine (which applies the damage) and the Skill Editor's
// Receives card (which tells the user it was applied) go through it — two
// hand-mirrored copies is how the card starts claiming a buff the engine never
// applies.
import { BUFF_TAG } from "./buffs/tags"

// Membership, not prefix: a tag is named or it isn't. Family coverage is
// expressed by every member also carrying the family tag, never by one name
// being a stem of another.
export function matchesAnyTag(tagSet: ReadonlySet<string>, tags: readonly string[]): boolean {
  return tags.some((tag) => tagSet.has(tag))
}

export function reaches(
  tagSet: ReadonlySet<string>,
  module: { id: string; affectsAll?: boolean },
): boolean {
  return module.affectsAll === true || tagSet.has(BUFF_TAG + module.id)
}
