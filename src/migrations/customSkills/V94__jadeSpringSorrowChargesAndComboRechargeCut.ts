// Spring Sorrow spends a charge at every Blossom Barrage rank, and at rank 6 a
// hit that finds your Combo on the target cuts 5 s off the recharge. A Skill
// Editor copy is rewritten only while its cost and its hit's triggers still
// equal what V93 left: once they differ, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const SPRING_SORROW_ID = "silkbindJade-umbq"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const COST_BEFORE = [
  {
    meterId: "springSorrowCharges",
    amount: 900,
    requiresParam: "blossomBarrage",
    requiresMaxTier: 5,
  },
]
const COST_AFTER = [{ meterId: "springSorrowCharges", amount: 900 }]
const COMBO_RECHARGE_CUT = {
  kind: "meterDelta",
  targetId: "springSorrowCharges",
  stacks: 300,
  condition: null,
  conditions: [{ buffId: "combo", op: "gte", stacks: 1, source: "buffEngine" }],
  cooldownFrames: 60,
  requiresParam: "blossomBarrage",
  requiresMinTier: 6,
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== SPRING_SORROW_ID) return skill
  const healed = sameValue(skill.meterCosts, COST_BEFORE)
    ? { ...skill, meterCosts: COST_AFTER }
    : skill
  if (!Array.isArray(healed.hits)) return healed
  const hits = healed.hits.map((hit, index) =>
    index === 0 && isRecord(hit) && sameValue(hit.triggers, [])
      ? { ...hit, triggers: [COMBO_RECHARGE_CUT] }
      : hit,
  )
  return { ...healed, hits }
}

export const V94__jadeSpringSorrowChargesAndComboRechargeCut: CustomSkillMigration = {
  to: 94,
  name: "V94__jadeSpringSorrowChargesAndComboRechargeCut",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 94, skills }
  },
}
