// v73 → v74 — Combo - Extend Mark is no longer granted by Spring Away's cast:
// it reaches every Spring Away bullet through the skill's receives, and the
// bullets land on the measured cue frames instead of every 10 f. A Skill Editor
// copy seeded before this still carries the cast-level grant, the old receives
// and the old frames. Each is rewritten only while it still equals what was
// seeded: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const EXTEND_MARK_ID = "comboExtendMark"
const SEEDED_GRANT_FRAME = 58
const SPRING_AWAY_SKILL_IDS: readonly string[] = [
  "silkbindJade-umblightcharge",
  "silkbindJade-umblightcharge-12",
]
const SEEDED_RECEIVES: readonly string[] = [
  "mistwillowHeavyBuff",
  "mistwillowBuff",
  "combo",
  "comboSpringAwayBonus",
  "windWall",
  "pursuitChargedBoost",
  "trajectorySkill",
  "thunderousBloom",
  "springThunder",
  "nonPlayerBaseDamage125",
  "vernalUmbrellaAdditionalAttack",
]
const SEEDED_FIRST_FRAME = 58
const SEEDED_FRAME_SPACING = 10
const CUE_FRAMES: readonly number[] = [58, 66, 77, 87, 98, 107, 117, 126, 136, 146, 156, 165]

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameMembers = (value: unknown, expected: readonly string[]): value is string[] =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((entry) => value.includes(entry))

function withoutSeededGrant(skill: RecordValue): RecordValue {
  const { triggersBuffs, triggersBuffsAtFrame, ...rest } = skill
  const grantIsSeeded =
    Array.isArray(triggersBuffs) &&
    triggersBuffs.length === 1 &&
    triggersBuffs[0] === EXTEND_MARK_ID &&
    isRecord(triggersBuffsAtFrame) &&
    Object.keys(triggersBuffsAtFrame).length === 1 &&
    triggersBuffsAtFrame[EXTEND_MARK_ID] === SEEDED_GRANT_FRAME
  return grantIsSeeded ? rest : skill
}

function withExtendMarkReceives(skill: RecordValue): RecordValue {
  const { receives } = skill
  if (!sameMembers(receives, SEEDED_RECEIVES)) return skill
  const comboIndex = receives.indexOf("comboSpringAwayBonus")
  return {
    ...skill,
    receives: [
      ...receives.slice(0, comboIndex + 1),
      EXTEND_MARK_ID,
      ...receives.slice(comboIndex + 1),
    ],
  }
}

function withCueFrames(skill: RecordValue): RecordValue {
  const { hits } = skill
  if (!Array.isArray(hits) || hits.length === 0 || hits.length > CUE_FRAMES.length) return skill
  const seeded = hits.every(
    (hit, index) =>
      isRecord(hit) && hit.frame === SEEDED_FIRST_FRAME + index * SEEDED_FRAME_SPACING,
  )
  if (!seeded) return skill
  return {
    ...skill,
    hits: hits.map((hit, index) => ({ ...(hit as RecordValue), frame: CUE_FRAMES[index] })),
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (!SPRING_AWAY_SKILL_IDS.includes(skill.id)) return skill
  return withCueFrames(withExtendMarkReceives(withoutSeededGrant(skill)))
}

export const V74__springAwayBulletsExtendMarkPerHit: CustomSkillMigration = {
  to: 74,
  name: "V74__springAwayBulletsExtendMarkPerHit",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 74, skills }
  },
}
