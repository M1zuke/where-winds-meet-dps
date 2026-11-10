// v120 → v121 — Spring Thunder and its Thunderous Bloom damage reach every hit
// of class 101 or 102 or tagged as a trajectory or wall hit: Bamboo Breeze, the
// hidden sword skills and both dual-weapon skills; the umbrella dual-weapon
// skill's hits also take Combo. A Skill Editor copy seeded before this lacks
// those buffs in its reach list. Only a list still identical to what was
// seeded is extended: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const THUNDER = ["thunderousBloom", "springThunder"]
const UMBRELLA = "vernalUmbrellaAdditionalAttack"
const HIDDEN_LIGHT_SEEDED = ["swallowcallLightAttackBoost", UMBRELLA]

interface ReachHeal {
  seeded: readonly string[]
  added: readonly string[]
}

const REACH_HEALS: Readonly<Record<string, ReachHeal>> = {
  "silkbindJade-bamboo-breeze": { seeded: [UMBRELLA], added: THUNDER },
  "silkbindJade-hidden-sword-light-1": { seeded: HIDDEN_LIGHT_SEEDED, added: THUNDER },
  "silkbindJade-hidden-sword-light-2": { seeded: HIDDEN_LIGHT_SEEDED, added: THUNDER },
  "silkbindJade-hidden-sword-light-3": { seeded: HIDDEN_LIGHT_SEEDED, added: THUNDER },
  "silkbindJade-hidden-sword-light-4": { seeded: HIDDEN_LIGHT_SEEDED, added: THUNDER },
  "silkbindJade-hidden-sword-light-5": { seeded: HIDDEN_LIGHT_SEEDED, added: THUNDER },
  "silkbindJade-hidden-sword-heavy-1": { seeded: [UMBRELLA], added: THUNDER },
  "silkbindJade-hidden-sword-heavy-2": { seeded: [UMBRELLA], added: THUNDER },
  "silkbindJade-hidden-sword-heavy-3": { seeded: [UMBRELLA], added: THUNDER },
  "silkbindJade-hidden-sword-heavy-alt": { seeded: [UMBRELLA], added: THUNDER },
  "silkbindJade-umbrella-dual": {
    seeded: ["windWall", "trajectorySkill", UMBRELLA],
    added: ["combo", ...THUNDER],
  },
  "silkbindJade-fan-dual": {
    seeded: ["windWall", "trajectorySkill", "inkwellFanAdditionalAttack"],
    added: THUNDER,
  },
}

const sameSet = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  [...value].sort().join("|") === [...expected].sort().join("|")

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const heal = REACH_HEALS[skill.id]
  if (!heal || !sameSet(skill.receives, heal.seeded)) return skill
  return { ...skill, receives: [...heal.seeded, ...heal.added] }
}

export const V121__jadeSpringThunderAndComboReach: CustomSkillMigration = {
  to: 121,
  name: "V121__jadeSpringThunderAndComboReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 121, skills }
  },
}
