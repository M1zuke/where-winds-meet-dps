// v132 → v133 — the previous shape gave Spring Away and the drone one attunement
// tag, and re-tagged Apricot Heaven copies with the Frequent Projectile line on
// every load. A copy's own attune tag masks the built-in one, so a stored seeded
// copy keeps the old tag until it is replaced here. Only a copy whose attune tags
// all belong to the set the old seeding and the per-load rename could produce is
// replaced: once another attune tag is present, a stale copy and a deliberate
// edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const FREQUENT_PROJECTILE = "attune:umbFrequentProjectile"
const CHARGED = "attune:umbCharged"
const SPECIAL = "attune:umbSpecial"
const OLD_VERNAL_UMBRELLA_TAGS: ReadonlySet<string> = new Set([
  FREQUENT_PROJECTILE,
  CHARGED,
  SPECIAL,
])

const SPRING_AWAY_TAGS = [FREQUENT_PROJECTILE, CHARGED]
const DRONE_TAGS = [FREQUENT_PROJECTILE, SPECIAL]
const APRICOT_HEAVEN_TAGS = [CHARGED]

const ATTUNE_TAGS_BY_SKILL_ID: Readonly<Record<string, readonly string[]>> = {
  "silkbindJade-umblightcharge": SPRING_AWAY_TAGS,
  "silkbindJade-umblightcharge-12": SPRING_AWAY_TAGS,
  "silkbindJade-umbdrone": DRONE_TAGS,
  "silkbindJade-umbdrone-12hit": DRONE_TAGS,
  "silkbindJade-umbdrone-16hit": DRONE_TAGS,
  "silkbindJade-umbdrone-20hit": DRONE_TAGS,
  "silkbindJade-umbdrone-23hit": DRONE_TAGS,
  "silkbindJade-umbdrone-26hit": DRONE_TAGS,
  "silkbindJade-apricot-heaven-normal": APRICOT_HEAVEN_TAGS,
  "silkbindJade-apricot-heaven-enhanced": APRICOT_HEAVEN_TAGS,
  "silkbindJade-apricot-heaven-rise": APRICOT_HEAVEN_TAGS,
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isAttuneTag = (tag: unknown): tag is string =>
  typeof tag === "string" && tag.startsWith("attune:")

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.tags)) return skill
  const target = ATTUNE_TAGS_BY_SKILL_ID[skill.id]
  if (!target) return skill
  const stored: unknown[] = skill.tags
  const storedAttune = stored.filter(isAttuneTag)
  if (storedAttune.length === 0 || !storedAttune.every((tag) => OLD_VERNAL_UMBRELLA_TAGS.has(tag)))
    return skill
  const firstAttuneIndex = stored.findIndex(isAttuneTag)
  const tags: unknown[] = []
  stored.forEach((tag, index) => {
    if (index === firstAttuneIndex) tags.push(...target)
    if (!isAttuneTag(tag)) tags.push(tag)
  })
  const unchanged =
    tags.length === stored.length && tags.every((tag, index) => tag === stored[index])
  return unchanged ? skill : { ...skill, tags }
}

export const V133__vernalUmbrellaAttuneTags: CustomSkillMigration = {
  to: 133,
  name: "V133__vernalUmbrellaAttuneTags",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 133, skills }
  },
}
