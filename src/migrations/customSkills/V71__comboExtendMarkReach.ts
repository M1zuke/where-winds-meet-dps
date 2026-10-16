// v70 → v71 — Spring Away (both bullet counts) grants Combo - Extend Mark on
// its first bullet. A Skill Editor copy seeded before this still lacks the
// grant. Only a copy that lists no granted buffs and no per-grant frames is
// rewritten: once it lists any, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const EXTEND_MARK_ID = "comboExtendMark"
const FIRST_BULLET_FRAME = 58
const SPRING_AWAY_SKILL_IDS: readonly string[] = [
  "silkbindJade-umblightcharge",
  "silkbindJade-umblightcharge-12",
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isEmptyList = (value: unknown): boolean =>
  value === undefined || (Array.isArray(value) && value.length === 0)

const isEmptyRecord = (value: unknown): boolean =>
  value === undefined || (isRecord(value) && Object.keys(value).length === 0)

export function healComboExtendMarkReach(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (!SPRING_AWAY_SKILL_IDS.includes(skill.id)) return skill
  if (!isEmptyList(skill.triggersBuffs) || !isEmptyRecord(skill.triggersBuffsAtFrame)) return skill
  return {
    ...skill,
    triggersBuffs: [EXTEND_MARK_ID],
    triggersBuffsAtFrame: { [EXTEND_MARK_ID]: FIRST_BULLET_FRAME },
  }
}

export const V71__comboExtendMarkReach: CustomSkillMigration = {
  to: 71,
  name: "V71__comboExtendMarkReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healComboExtendMarkReach)
      : blob.skills
    return { ...blob, v: 71, skills }
  },
}
