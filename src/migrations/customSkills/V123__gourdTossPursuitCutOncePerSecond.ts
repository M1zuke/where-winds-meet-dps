// v122 → v123 — Gourd Toss rank 6 cuts Peak's Springless Silence's recharge by
// 1 s at most once per second inside its window, not at every Moon Shatter
// Spring strike. A Skill Editor copy seeded before this carries the cut without
// that cooldown. Only a cut still identical to what was seeded is rewritten:
// once it differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const MOON_SHATTER_SPRING_IDS: ReadonlySet<string> = new Set([
  "silkbindJade-fanheavypursuit-3-hit",
  "silkbindJade-fanheavypursuit-5-hit",
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, entry) =>
    isRecord(entry)
      ? Object.fromEntries(
          Object.entries(entry).sort(([left], [right]) => left.localeCompare(right)),
        )
      : entry,
  )

const SEEDED_CUT = {
  kind: "meterDelta",
  targetId: "peaksSpringlessSilenceCharges",
  stacks: 60,
  condition: null,
  conditions: [{ buffId: "gourdTossPursuitCutWindow", op: "gte", stacks: 1 }],
  requiresParam: "gourdToss",
  requiresMinTier: 6,
}
const HEALED_CUT = { ...SEEDED_CUT, cooldownFrames: 60 }

const healHit = (hit: unknown): unknown => {
  if (!isRecord(hit) || !Array.isArray(hit.triggers)) return hit
  return {
    ...hit,
    triggers: hit.triggers.map((trigger) =>
      canonical(trigger) === canonical(SEEDED_CUT) ? { ...HEALED_CUT } : trigger,
    ),
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !MOON_SHATTER_SPRING_IDS.has(skill.id))
    return skill
  return Array.isArray(skill.hits) ? { ...skill, hits: skill.hits.map(healHit) } : skill
}

export const V123__gourdTossPursuitCutOncePerSecond: CustomSkillMigration = {
  to: 123,
  name: "V123__gourdTossPursuitCutOncePerSecond",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 123, skills }
  },
}
