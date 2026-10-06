// v65 → v66 — every perfect dodge under Ghostly Steps - Umbra now casts its own
// Ghostly Afterimage 48 frames later; it used to apply a one-tick debuff, so
// two dodges inside 48 frames merged into one explosion. A Skill Editor copy of
// a perfect dodge seeded before this still carries the debuff trigger. Only a
// trigger still identical to what was seeded is rewritten: once it differs, a
// stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, nested) =>
    isRecord(nested)
      ? Object.fromEntries(
          Object.entries(nested).sort(([left], [right]) => (left < right ? -1 : 1)),
        )
      : nested,
  )

const PERFECT_DODGE_ID = /^[A-Za-z]+-perfect-dodge(-full)?$/
const GHOSTLY_STEPS_UMBRA_UP = [{ buffId: "ghostlyStepsUmbra", op: "gte", stacks: 1 }]

const OLD_AFTERIMAGE_TRIGGER = {
  kind: "applyDebuff",
  targetId: "debuff-mystic-ghostly-afterimage",
  stacks: 1,
  condition: null,
  conditions: GHOSTLY_STEPS_UMBRA_UP,
}

const NEW_AFTERIMAGE_TRIGGER = {
  kind: "castSkill",
  targetId: "mystic-ghostly-afterimage",
  stacks: 1,
  condition: null,
  conditions: GHOSTLY_STEPS_UMBRA_UP,
}

const swapTrigger = (trigger: unknown): unknown =>
  canonical(trigger) === canonical(OLD_AFTERIMAGE_TRIGGER)
    ? JSON.parse(JSON.stringify(NEW_AFTERIMAGE_TRIGGER))
    : trigger

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !PERFECT_DODGE_ID.test(skill.id)) {
    return skill
  }
  if (!Array.isArray(skill.hits)) return skill
  return {
    ...skill,
    hits: skill.hits.map((hit) =>
      isRecord(hit) && Array.isArray(hit.triggers)
        ? { ...hit, triggers: hit.triggers.map(swapTrigger) }
        : hit,
    ),
  }
}

export const V66__ghostlyAfterimagePerDodge: CustomSkillMigration = {
  to: 66,
  name: "V66__ghostlyAfterimagePerDodge",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 66, skills }
  },
}
