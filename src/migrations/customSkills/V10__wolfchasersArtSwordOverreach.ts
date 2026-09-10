// v9 → v10 — the Wolfchaser's Art damage bonus reaches only Sober Sorrow (the
// spear Q chain); the five sword Martial Q rows never carried it in game. A
// Skill Editor copy seeded before that fix still lists the buff id. Removed
// only from a copy whose `receives` is still exactly the single-entry list it
// was seeded with — a list that differs has been edited, and a stale copy and
// a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const SWORD_MARTIAL_Q_IDS = new Set([
  "bellstrikeUmbra-swordq",
  "bellstrikeUmbra-swordqfollowup",
  "bellstrikeUmbra-swordq-follow-up-1-hit-cancel",
  "bellstrikeUmbra-swordq-follow-up-2-hit-cancel",
  "bellstrikeUmbra-sword-martial-qqq",
])
const SEEDED_RECEIVES = ["wolfchasersArtMartialDamage"]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isUntouchedSeededList = (list: unknown): boolean =>
  Array.isArray(list) &&
  list.length === SEEDED_RECEIVES.length &&
  list.every((entry, index) => entry === SEEDED_RECEIVES[index])

export function healWolfchasersArtSwordOverreach(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (!SWORD_MARTIAL_Q_IDS.has(skill.id)) return skill
  if (!isUntouchedSeededList(skill.receives)) return skill
  const { receives: _receives, ...rest } = skill
  return rest
}

export const V10__wolfchasersArtSwordOverreach: CustomSkillMigration = {
  to: 10,
  name: "V10__wolfchasersArtSwordOverreach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healWolfchasersArtSwordOverreach)
      : blob.skills
    return { ...blob, v: 10, skills }
  },
}
