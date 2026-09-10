// v10 → v11 — the Mistwillow four-piece bonus reaches only a character's
// basic light and heavy attack rows in game; the spear's Charged Skill and
// Special Skill are filed under different skill families the bonus does not
// name, so the five spear modules behind them never carried it. A Skill
// Editor copy seeded before that fix still lists both buff ids. Removed only
// from a copy whose `receives` is still exactly the two-entry list it was
// seeded with, in the seeded order — a list that differs has been edited,
// and a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const SPEAR_MISTWILLOW_SKILL_IDS = new Set([
  "bellstrikeUmbra-spearheavy",
  "bellstrikeUmbra-spearheavy-1-hit",
  "bellstrikeUmbra-spearheavy-1-hit-prepull",
  "bellstrikeUmbra-spearspecial",
  "bellstrikeUmbra-spearspecial-1-hit-cancel",
])
const SEEDED_RECEIVES = ["mistwillowLightBuff", "mistwillowBuff"]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isUntouchedSeededList = (list: unknown): boolean =>
  Array.isArray(list) &&
  list.length === SEEDED_RECEIVES.length &&
  list.every((entry, index) => entry === SEEDED_RECEIVES[index])

export function healSpearMistwillowReach(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (!SPEAR_MISTWILLOW_SKILL_IDS.has(skill.id)) return skill
  if (!isUntouchedSeededList(skill.receives)) return skill
  const { receives: _receives, ...rest } = skill
  return rest
}

export const V11__spearMistwillowReach: CustomSkillMigration = {
  to: 11,
  name: "V11__spearMistwillowReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healSpearMistwillowReach)
      : blob.skills
    return { ...blob, v: 11, skills }
  },
}
