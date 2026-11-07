// v38 -> v39 — three new hit-level meter gains this engine reads from a
// build's own crit/affinity chance or a target's own Bleeding stacks, on
// every built-in skill the in-game rows name. None has an editable surface in
// the Skill Editor, so a stored copy is healed unconditionally, matched by
// each addition's own `cooldownGroup` rather than by hit index.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

interface HitTrigger {
  kind: string
  targetId: string
  stacks: number
  condition: unknown
  [key: string]: unknown
}

const ENDURANCE = "endurance"

const BATTLE_ANTHEM_ENDURANCE_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 10,
  condition: null,
  cooldownFrames: 720,
  cooldownGroup: "battleAnthemEnduranceGain",
  requiresParam: "battleAnthem",
  requiresMinTier: 3,
}

const bleedMechanismEnhancementGain = (cooldownGroup: string): HitTrigger => ({
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 10,
  condition: { buffId: "debuff-bellstrikeUmbra-bleed-tick", op: "gte", stacks: 4 },
  cooldownFrames: 120,
  cooldownGroup,
})

const INNER_BALANCE_STRIKE_III_BLEED_REFUND = bleedMechanismEnhancementGain(
  "bleedMechanismEnhancement-innerBalanceStrikeIII",
)
const SWORD_MARTIAL_QQQ_BLEED_REFUND = bleedMechanismEnhancementGain(
  "bleedMechanismEnhancement-swordMartialQqq",
)
const SWORD_R_CHARGE_FOLLOW_UP_BLEED_REFUND = bleedMechanismEnhancementGain(
  "bleedMechanismEnhancement-swordRChargeFollowUp",
)
const CROSSWIND_BLADE_BLEED_REFUND = bleedMechanismEnhancementGain(
  "bleedMechanismEnhancement-crosswindBlade",
)

const ENERGY_SURGE_ENDURANCE_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 20,
  condition: null,
  cooldownFrames: 1200,
  cooldownDecayFramesPerAttempt: 60,
  cooldownFloorFrames: 720,
  cooldownGroup: "energySurgeGrant",
  requiresParam: "swordMorph",
  requiresMinTier: 6,
}

const ENDLESS_GALE_AT_START_GRANT: HitTrigger = {
  kind: "applyBuff",
  targetId: "endlessGaleAtStart",
  stacks: 1,
  condition: null,
}
const ENDLESS_GALE_GRANT: HitTrigger = {
  kind: "applyBuff",
  targetId: "endlessGale",
  stacks: 1,
  condition: null,
  appliesOnCastEnd: true,
}
const ENDLESS_GALE_MOUNTAINS_MIGHT_EXTEND: HitTrigger = {
  kind: "applyBuff",
  targetId: "endlessGale",
  stacks: 1,
  condition: null,
  appliesOnCastEnd: true,
  extendFrames: 300,
  requiresParam: "mountainsMight",
}
const ENDLESS_GALE_COST_REDUCTION_END: HitTrigger = {
  kind: "applyBuff",
  targetId: "endlessGaleCostReductionEnd",
  stacks: 1,
  condition: null,
  appliesOnCastEnd: true,
  requiresParam: "mountainsMight",
}

interface SkillGainPatch {
  matchId: (id: string) => boolean
  // Index into the skill's own `hits` array -> the triggers that hit now
  // carries, appended after every trigger it already had.
  appendHitTriggers: Record<number, HitTrigger[]>
  // Ids to drop from `triggersBuffs`: replaced here by the hit-level triggers
  // above, which carry their own frame timing (`appliesOnCastEnd`,
  // `extendFrames`) a bare cast-start declaration cannot express.
  removeTriggersBuffs?: string[]
}

const exact = (id: string) => (candidate: string) => candidate === id

const PATCHES: SkillGainPatch[] = [
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged"),
    appendHitTriggers: { 0: [BATTLE_ANTHEM_ENDURANCE_GAIN, ENERGY_SURGE_ENDURANCE_GAIN] },
  },
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged-2-hit"),
    appendHitTriggers: { 0: [BATTLE_ANTHEM_ENDURANCE_GAIN, ENERGY_SURGE_ENDURANCE_GAIN] },
  },
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged-prepull"),
    appendHitTriggers: { 0: [BATTLE_ANTHEM_ENDURANCE_GAIN, ENERGY_SURGE_ENDURANCE_GAIN] },
  },
  {
    matchId: exact("bellstrikeSplendor-energysurge"),
    appendHitTriggers: { 0: [BATTLE_ANTHEM_ENDURANCE_GAIN, ENERGY_SURGE_ENDURANCE_GAIN] },
  },
  {
    matchId: exact("bellstrikeSplendor-spearq"),
    appendHitTriggers: {
      0: [
        ENDLESS_GALE_AT_START_GRANT,
        ENDLESS_GALE_GRANT,
        ENDLESS_GALE_MOUNTAINS_MIGHT_EXTEND,
        ENDLESS_GALE_COST_REDUCTION_END,
      ],
    },
    removeTriggersBuffs: ["endlessGale", "endlessGaleAtStart"],
  },
  {
    matchId: exact("bellstrikeSplendor-spearq-prepull"),
    appendHitTriggers: {
      0: [
        ENDLESS_GALE_AT_START_GRANT,
        ENDLESS_GALE_GRANT,
        ENDLESS_GALE_MOUNTAINS_MIGHT_EXTEND,
        ENDLESS_GALE_COST_REDUCTION_END,
      ],
    },
    removeTriggersBuffs: ["endlessGale", "endlessGaleAtStart"],
  },
  {
    matchId: exact("bellstrikeSplendor-spearq-0-hit-cancel"),
    appendHitTriggers: {
      0: [
        ENDLESS_GALE_AT_START_GRANT,
        ENDLESS_GALE_GRANT,
        ENDLESS_GALE_MOUNTAINS_MIGHT_EXTEND,
        ENDLESS_GALE_COST_REDUCTION_END,
      ],
    },
    removeTriggersBuffs: ["endlessGale", "endlessGaleAtStart"],
  },
  {
    matchId: exact("bellstrikeUmbra-swordspecial-1-hit"),
    appendHitTriggers: { 0: [INNER_BALANCE_STRIKE_III_BLEED_REFUND] },
  },
  {
    matchId: exact("bellstrikeUmbra-swordspecial-2-hit"),
    appendHitTriggers: {
      0: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
      1: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
    },
  },
  {
    matchId: exact("bellstrikeUmbra-swordspecial-3-hit"),
    appendHitTriggers: {
      0: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
      1: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
      2: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
    },
  },
  {
    matchId: exact("bellstrikeUmbra-swordspecial-4-hit"),
    appendHitTriggers: {
      0: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
      1: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
      2: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
    },
  },
  {
    matchId: exact("bellstrikeUmbra-swordspecial-4-hit-final"),
    appendHitTriggers: { 0: [INNER_BALANCE_STRIKE_III_BLEED_REFUND] },
  },
  {
    matchId: exact("bellstrikeUmbra-sword-martial-qqq"),
    appendHitTriggers: {
      0: [SWORD_MARTIAL_QQQ_BLEED_REFUND],
      1: [SWORD_MARTIAL_QQQ_BLEED_REFUND],
    },
  },
  {
    matchId: exact("bellstrikeUmbra-sword-r-charge-follow-up"),
    appendHitTriggers: {
      0: [SWORD_R_CHARGE_FOLLOW_UP_BLEED_REFUND],
      1: [SWORD_R_CHARGE_FOLLOW_UP_BLEED_REFUND],
    },
  },
  {
    matchId: exact("bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel"),
    appendHitTriggers: { 0: [SWORD_R_CHARGE_FOLLOW_UP_BLEED_REFUND] },
  },
  {
    matchId: exact("bellstrikeUmbra-crosswind-blade"),
    appendHitTriggers: { 0: [CROSSWIND_BLADE_BLEED_REFUND] },
  },
  {
    matchId: exact("bellstrikeUmbra-crosswind-blade-cancel"),
    appendHitTriggers: { 0: [CROSSWIND_BLADE_BLEED_REFUND] },
  },
]

function alreadyHasMeterDeltaCooldownGroup(triggers: unknown, cooldownGroup: string): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) &&
        trigger.kind === "meterDelta" &&
        trigger.cooldownGroup === cooldownGroup,
    )
  )
}

function alreadyHasApplyBuff(triggers: unknown, targetId: string, isExtend: boolean): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) &&
        trigger.kind === "applyBuff" &&
        trigger.targetId === targetId &&
        (trigger.extendFrames !== undefined) === isExtend,
    )
  )
}

function alreadyHas(existingTriggers: unknown[], addition: HitTrigger): boolean {
  if (addition.kind === "meterDelta") {
    return alreadyHasMeterDeltaCooldownGroup(existingTriggers, addition.cooldownGroup as string)
  }
  return alreadyHasApplyBuff(
    existingTriggers,
    addition.targetId,
    addition.extendFrames !== undefined,
  )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const patch = PATCHES.find((candidate) => candidate.matchId(skill.id as string))
  if (!patch || !Array.isArray(skill.hits)) return skill

  const next: Record<string, unknown> = {
    ...skill,
    hits: skill.hits.map((hit, index) => {
      const additions = patch.appendHitTriggers[index]
      if (!additions || !isRecord(hit)) return hit
      const existingTriggers = Array.isArray(hit.triggers) ? hit.triggers : []
      const missing = additions.filter((addition) => !alreadyHas(existingTriggers, addition))
      if (missing.length === 0) return hit
      return { ...hit, triggers: [...existingTriggers, ...missing] }
    }),
  }
  if (patch.removeTriggersBuffs && Array.isArray(skill.triggersBuffs)) {
    next.triggersBuffs = skill.triggersBuffs.filter(
      (id) => !patch.removeTriggersBuffs!.includes(id as string),
    )
  }
  return next
}

export const V39__meterModifierGains: CustomSkillMigration = {
  to: 39,
  name: "V39__meterModifierGains",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 39, skills }
  },
}
