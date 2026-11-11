// v110 → v111 — Volutefit's Winebound damage also reaches the Dragon's Breath
// and Drunken Poet hits. A Skill Editor copy seeded before this still lacks the
// buff in its receives list. Only a list still identical to what was seeded is
// extended: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const VOLUTEFIT = "volutefitWineboundDamage"

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameList = (value: unknown, expected: readonly string[]): boolean =>
  (value === undefined && expected.length === 0) ||
  (Array.isArray(value) &&
    value.length === expected.length &&
    expected.every((entry, index) => value[index] === entry))

const SEEDED_RECEIVES: Readonly<Record<string, readonly string[]>> = {
  "mystic-fire-breath-1-hit": [],
  "mystic-fire-breath-1-hit-prepull": [],
  "mystic-fire-breath-2-hit": [],
  "mystic-dragon-fire-smolder-1-hit": [],
  "mystic-dragon-fire-smolder-2-hits": [],
  "mystic-poet1": [],
  "mystic-poet2": [],
  "mystic-poet3": [],
  "mystic-poet4": [],
  "mystic-poet-final-hit-cancel": ["poetFinalStrikeStack"],
  "mystic-poet-final-hit-cancel-explosion": [],
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const seeded = SEEDED_RECEIVES[skill.id]
  if (!seeded || !sameList(skill.receives, seeded)) return skill
  return { ...skill, receives: [...seeded, VOLUTEFIT] }
}

export const V111__volutefitReachesWineboundMystics: CustomSkillMigration = {
  to: 111,
  name: "V111__volutefitReachesWineboundMystics",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 111, skills }
  },
}
