// v87 → v88 — with the Mistwillow set worn, Bamboocut Draught's light attacks
// (the gauntlet chains, the twin-blade chain, Blade Against Waves) and heavy
// attacks (Dragonquench - Inebriate, Boundvessel, Blade Vessel, Tidepour) take
// part in its two stances. A Skill Editor copy seeded before this still lacks
// the buffs in its receives list. Only a list still identical to what was
// seeded is extended: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameList = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((entry, index) => value[index] === entry)

const LIGHT_ATTACK_BUFFS = ["mistwillowHeavyBuff", "mistwillowBuff"]
const HEAVY_ATTACK_BUFFS = ["mistwillowLightBuff", "mistwillowBuff"]

const INEBRIATE_ENHANCED = [
  "eonpourInebriateDamage",
  "inebriateSkillCritDamage",
  "drunkslayEcho",
  "volutefitWineboundDamage",
  "tiltrimInebriateBonus",
]
const GAUNTLET_LIGHT = [
  "swallowcallLightAttackBoost",
  "eonpourInebriateDamage",
  "skystrikeGauntletsAdditionalAttack",
]
const TWINBLADE_LIGHT = [
  "nonPlayerBaseDamage10",
  "swallowcallLightAttackBoost",
  "eonpourInebriateDamage",
  "rivenTwinbladesAdditionalAttack",
]
const TWINBLADE_ENHANCED = [...INEBRIATE_ENHANCED, "rivenTwinbladesAdditionalAttack"]
const DRAGONQUENCH = [
  ...INEBRIATE_ENHANCED,
  "skystrikeGauntletsAdditionalAttack",
  "nonPlayerBaseDamage40",
  "bingePointGainNoAbrasion",
]
const BOUNDVESSEL = [...TWINBLADE_ENHANCED, "nonPlayerBaseDamage50"]

interface Seeded {
  before: readonly string[]
  added: readonly string[]
}

const light = (before: readonly string[]): Seeded => ({ before, added: LIGHT_ATTACK_BUFFS })
const heavy = (before: readonly string[]): Seeded => ({ before, added: HEAVY_ATTACK_BUFFS })

const SEEDED: Readonly<Record<string, Seeded>> = {
  "bamboocutDraught-light-attack": light(GAUNTLET_LIGHT),
  "bamboocutDraught-bloombreak": light(GAUNTLET_LIGHT),
  "bamboocutDraught-dual-blades-light-attack-1": light(TWINBLADE_LIGHT),
  "bamboocutDraught-dual-blades-light-attack-2": light(TWINBLADE_LIGHT),
  "bamboocutDraught-dual-blades-light-attack-3": light(TWINBLADE_LIGHT),
  "bamboocutDraught-dual-blades-light-attack-4": light(TWINBLADE_LIGHT),
  "bamboocutDraught-blade-against-waves": light(TWINBLADE_ENHANCED),
  "bamboocutDraught-dragonquench-inebriate": heavy(DRAGONQUENCH),
  "bamboocutDraught-dragonquench-inebriate-cancel": heavy(DRAGONQUENCH),
  "bamboocutDraught-dragonquench-inebriate-second": heavy(DRAGONQUENCH),
  "bamboocutDraught-dragonquench-inebriate-second-cancel": heavy(DRAGONQUENCH),
  "bamboocutDraught-dragonquench-inebriate-third": heavy(DRAGONQUENCH),
  "bamboocutDraught-dragonquench-inebriate-third-cancel": heavy(DRAGONQUENCH),
  "bamboocutDraught-boundvessel": heavy(BOUNDVESSEL),
  "bamboocutDraught-boundvessel-drink-cancel": heavy(BOUNDVESSEL),
  "bamboocutDraught-blade-vessel": heavy([
    "eonpourInebriateDamage",
    "rivenTwinbladesAdditionalAttack",
    "nonPlayerBaseDamage50",
  ]),
  "bamboocutDraught-tidepour": heavy(TWINBLADE_ENHANCED),
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const seeded = SEEDED[skill.id]
  if (!seeded || !sameList(skill.receives, seeded.before)) return skill
  return { ...skill, receives: [...seeded.before, ...seeded.added] }
}

export const V88__draughtMistwillowReach: CustomSkillMigration = {
  to: 88,
  name: "V88__draughtMistwillowReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 88, skills }
  },
}
