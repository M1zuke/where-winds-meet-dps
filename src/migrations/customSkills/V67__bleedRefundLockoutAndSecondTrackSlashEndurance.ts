// v66 → v67 — the Bleeding Endurance refund is one shared lockout released by
// an Inner Balance Strike III's end, reading Bleeding before the hit's own
// stack, instead of four 120-frame per-skill cooldowns; Second Track Slash
// spends its immediate cost 30 frames into the cast and freezes regeneration
// from the charge start rather than the press. A Skill Editor copy seeded
// before this still carries the old shapes. Only a value still identical to
// what was seeded is rewritten: once it differs, a stale copy and a
// deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, nested) =>
    isRecord(nested)
      ? Object.fromEntries(
          Object.entries(nested).sort(([left], [right]) => (left < right ? -1 : 1)),
        )
      : nested,
  )

const BLEED_TICK_ID = "debuff-bellstrikeUmbra-bleed-tick"
const LOCKOUT_GROUP = "bleedMechanismEnhancement"

const oldRefund = (cooldownGroup: string): RecordValue => ({
  kind: "meterDelta",
  targetId: "endurance",
  stacks: 10,
  condition: { buffId: BLEED_TICK_ID, op: "gte", stacks: 4 },
  cooldownFrames: 120,
  cooldownGroup,
})

const OLD_REFUNDS = [
  "bleedMechanismEnhancement-innerBalanceStrikeIII",
  "bleedMechanismEnhancement-swordMartialQqq",
  "bleedMechanismEnhancement-swordRChargeFollowUp",
  "bleedMechanismEnhancement-crosswindBlade",
].map((group) => canonical(oldRefund(group)))

const NEW_REFUND: RecordValue = {
  kind: "meterDelta",
  targetId: "endurance",
  stacks: 10,
  condition: { buffId: BLEED_TICK_ID, op: "gte", stacks: 4 },
  conditionsBeforeHit: true,
  cooldownFrames: 180,
  cooldownGroup: LOCKOUT_GROUP,
}

const LOCKOUT_RELEASE: RecordValue = {
  kind: "cooldownCut",
  targetId: LOCKOUT_GROUP,
  stacks: 180,
  condition: null,
  appliesOnCastEnd: true,
}

const SWORD_SPECIAL_ID = /^bellstrikeUmbra-swordspecial-[1-4]-hit$/
const REFUND_SKILL_IDS = new Set([
  "bellstrikeUmbra-swordspecial-4-hit-final",
  "bellstrikeUmbra-sword-martial-qqq",
  "bellstrikeUmbra-sword-r-charge-follow-up",
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
  "bellstrikeUmbra-crosswind-blade",
  "bellstrikeUmbra-crosswind-blade-cancel",
])
const SECOND_TRACK_SLASH_ID = /^bellstrikeUmbra-sword-charge-stage-[12]-[1-5]-hit$/

const OLD_COST = canonical({ meterId: "endurance", amount: 6 })
const OLD_FREEZE = canonical({ meterId: "endurance", fromFrame: 0 })

const isOldRefund = (trigger: unknown): boolean => OLD_REFUNDS.includes(canonical(trigger))

const healRefundHit = (hit: unknown, isFirstSpecialHit: boolean): unknown => {
  if (!isRecord(hit) || !Array.isArray(hit.triggers) || !hit.triggers.some(isOldRefund)) return hit
  const triggers = hit.triggers.map((trigger) =>
    isOldRefund(trigger) ? JSON.parse(JSON.stringify(NEW_REFUND)) : trigger,
  )
  if (isFirstSpecialHit) triggers.push(JSON.parse(JSON.stringify(LOCKOUT_RELEASE)))
  return { ...hit, triggers }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  let healed: RecordValue = skill
  const isSwordSpecial = SWORD_SPECIAL_ID.test(skill.id)
  if (Array.isArray(skill.hits) && (isSwordSpecial || REFUND_SKILL_IDS.has(skill.id))) {
    healed = {
      ...healed,
      hits: skill.hits.map((hit, index) => healRefundHit(hit, isSwordSpecial && index === 0)),
    }
  }
  if (SECOND_TRACK_SLASH_ID.test(skill.id)) {
    if (Array.isArray(skill.meterCosts))
      healed = {
        ...healed,
        meterCosts: skill.meterCosts.map((cost) =>
          canonical(cost) === OLD_COST ? { ...(cost as RecordValue), atFrame: 30 } : cost,
        ),
      }
    if (Array.isArray(skill.meterFreezes))
      healed = {
        ...healed,
        meterFreezes: skill.meterFreezes.map((freeze) =>
          canonical(freeze) === OLD_FREEZE ? { ...(freeze as RecordValue), fromFrame: 13 } : freeze,
        ),
      }
  }
  return healed
}

export const V67__bleedRefundLockoutAndSecondTrackSlashEndurance: CustomSkillMigration = {
  to: 67,
  name: "V67__bleedRefundLockoutAndSecondTrackSlashEndurance",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 67, skills }
  },
}
