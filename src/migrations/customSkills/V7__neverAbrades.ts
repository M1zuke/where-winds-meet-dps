// v6 → v7 — guaranteedPrecision never forced precision to 1; it only ever
// removed the abrasion outcome, which is what its own Skill Editor hint
// already said. Renamed to neverAbrades on every stored skill, seeded or
// user-authored, since the field's meaning never changed.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function migrateNeverAbradesSkill(skill: unknown): unknown {
  if (!isRec(skill) || !("guaranteedPrecision" in skill)) return skill
  const { guaranteedPrecision, ...rest } = skill
  return guaranteedPrecision === true ? { ...rest, neverAbrades: true } : rest
}

export const V7__neverAbrades: CustomSkillMigration = {
  to: 7,
  name: "V7__neverAbrades",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(migrateNeverAbradesSkill)
      : blob.skills
    return { ...blob, v: 7, skills }
  },
}
