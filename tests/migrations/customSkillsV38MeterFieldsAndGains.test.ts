import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V38__meterFieldsAndGains,
  healSkill,
} from "../../src/migrations/customSkills/V38__meterFieldsAndGains"
import { loadCustomSkills } from "../../src/storage"
import { seedSkillFromBuiltin, type Skill } from "../../src/engine/skill"
import storeV37File from "./testCustomSkills/v37/store.json"
import { swordspecial1Hit } from "../../src/data/skills/bellstrike-umbra/swordspecial-1-hit"
import { swordspecial2Hit } from "../../src/data/skills/bellstrike-umbra/swordspecial-2-hit"
import { swordspecial3Hit } from "../../src/data/skills/bellstrike-umbra/swordspecial-3-hit"
import { swordMartialQqq } from "../../src/data/skills/bellstrike-umbra/sword-martial-qqq"
import { swordRChargeFollowUp } from "../../src/data/skills/bellstrike-umbra/sword-r-charge-follow-up"
import { swordRChargeFollowUp1HitCancel } from "../../src/data/skills/bellstrike-umbra/sword-r-charge-follow-up-1-hit-cancel"
import { phalanxspecialPrepull } from "../../src/data/skills/stonesplit-strength/phalanxspecial-prepull"
import { anxisoldierhengStab } from "../../src/data/skills/stonesplit-strength/anxisoldierheng"
import { anxisoldiermojump } from "../../src/data/skills/stonesplit-strength/anxisoldiermojump"
import { perfectDodge } from "../../src/data/skills/universal/perfect-dodge"
import { perfectDodgeFull } from "../../src/data/skills/universal/perfect-dodge-full"
import {
  INNER_BALANCE_STRIKE_III_BLEED_REFUND,
  SWORD_MARTIAL_QQQ_BLEED_REFUND,
  SWORD_R_CHARGE_FOLLOW_UP_BLEED_REFUND,
} from "../../src/data/skills/bellstrike-umbra/buffs/bleedMechanismEnhancement"
import { CRISSCROSS_ENDURANCE_GAIN } from "../../src/data/skills/bellstrike-umbra/buffs/crisscrossEnduranceGain"
import { ANXI_SOLDIER_BLADE_MOMENTUM_GAIN } from "../../src/data/skills/stonesplit-strength/buffs/anxiSoldierBladeMomentumGain"
import { CALMWATERS_PERFECT_DODGE_GAIN } from "../../src/data/skills/universal/buffs/calmwatersPerfectDodgeGain"
import { EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS } from "../../src/data/skills/universal/buffs/evasiveChargeDodgeRefund"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV37File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

// One representative id per patch shape this step applies: a skill-level
// cost plus per-hit gains on every hit, a drain/freeze pair with a
// condition-gated spend, a hit-only gain with no condition, and a
// suffix-matched universal skill.
const REPRESENTATIVE_IDS = [
  "stonesplitStrength-snowpartingcharged",
  "bellstrikeSplendor-swordheavycharged",
  "bellstrikeUmbra-crosswind-blade",
  "bamboocutDraught-perfect-dodge",
  "silkbindJade-fanlightcharged",
]

// Every matchId V38 patches. Kept independent of `V38__meterFieldsAndGains`'s
// own (unexported) patch table, so a change there that silently drops an id
// still leaves this list — and the completeness check below — unaffected.
const ALL_MATCH_IDS = [
  "stonesplitStrength-snowpartingcharged",
  "stonesplitStrength-snowpartingcharged-forgetfulness",
  "stonesplitStrength-snowpartingvc",
  "stonesplitStrength-snowpartingvc-prepull",
  "stonesplitStrength-snowpartingspecial",
  "stonesplitStrength-phalanxspecial",
  "stonesplitStrength-phalanxspecial-prepull",
  "stonesplitStrength-phalanxcharged-s3",
  "stonesplitStrength-anxisoldierheng",
  "stonesplitStrength-anxisoldierheng-stab",
  "stonesplitStrength-anxisoldiermodown",
  "stonesplitStrength-anxisoldiermojump",
  "stonesplitStrength-anxisoldiermosweep",
  "stonesplitStrength-phalanxcharged-s3-innerpassion",
  "bellstrikeSplendor-swordheavycharged",
  "bellstrikeSplendor-swordheavycharged-2-hit",
  "bellstrikeSplendor-swordheavycharged-prepull",
  "bellstrikeSplendor-energysurge",
  "bellstrikeSplendor-spearq",
  "bellstrikeSplendor-spearq-prepull",
  "bellstrikeSplendor-spearq-0-hit-cancel",
  "bellstrikeUmbra-swordspecial-1-hit",
  "bellstrikeUmbra-swordspecial-2-hit",
  "bellstrikeUmbra-swordspecial-3-hit",
  "bellstrikeUmbra-swordspecial-4-hit",
  "bellstrikeUmbra-spearspecial",
  "bellstrikeUmbra-spearspecial-1-hit-cancel",
  "bellstrikeUmbra-sword-martial-qqq",
  "bellstrikeUmbra-sword-r-charge-follow-up",
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
  "bellstrikeUmbra-crosswind-blade",
  "bellstrikeUmbra-crosswind-blade-cancel",
  "bellstrikeSplendor-swordspecial",
  "silkbindJade-fanlightcharged",
  "bamboocutDraught-perfect-dodge",
  "bamboocutDraught-perfect-dodge-full",
  "universal-perfect-dodge",
  "universal-perfect-dodge-full",
]

// These ids have no captured copy in the v37 fixture at all, so their
// untouched-seeded shape is built from the built-in skill directly: the
// current built-in already carries every later hop's own addition too, so
// each one is stripped back to its genuine pre-V38 shape before seeding.
const MISSING_FROM_FIXTURE_IDS = [
  "stonesplitStrength-phalanxspecial-prepull",
  "stonesplitStrength-anxisoldierheng-stab",
  "stonesplitStrength-anxisoldiermojump",
  "bellstrikeUmbra-swordspecial-1-hit",
  "bellstrikeUmbra-swordspecial-2-hit",
  "bellstrikeUmbra-swordspecial-3-hit",
  "bellstrikeUmbra-sword-martial-qqq",
  "bellstrikeUmbra-sword-r-charge-follow-up",
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
  "universal-perfect-dodge",
  "universal-perfect-dodge-full",
]

const FIXTURE_BACKED_IDS = ALL_MATCH_IDS.filter((id) => !MISSING_FROM_FIXTURE_IDS.includes(id))

function withoutMeterGate(skill: Skill): Skill {
  const { meterCosts, castConditions, ...rest } = skill
  return rest as Skill
}

function withoutHitTriggers(skill: Skill, removals: Record<number, unknown[]>): Skill {
  return {
    ...skill,
    hits: skill.hits.map((hit, index) => {
      const toRemove = removals[index]
      if (!toRemove) return hit
      return { ...hit, triggers: hit.triggers.filter((trigger) => !toRemove.includes(trigger)) }
    }),
  }
}

// The genuine pre-V38 shape of every built-in this step patches but the v37
// fixture never captured a copy of — every later hop's own addition
// (V39's bleed-mechanism-enhancement gains) stripped back out alongside V38's.
const PRE_V38_BUILTINS: Record<string, Skill> = {
  "stonesplitStrength-phalanxspecial-prepull": withoutMeterGate(phalanxspecialPrepull),
  "stonesplitStrength-anxisoldierheng-stab": withoutHitTriggers(anxisoldierhengStab, {
    0: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
    1: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
    2: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
    3: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
  }),
  "stonesplitStrength-anxisoldiermojump": withoutHitTriggers(anxisoldiermojump, {
    0: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
  }),
  "bellstrikeUmbra-swordspecial-1-hit": withoutHitTriggers(withoutMeterGate(swordspecial1Hit), {
    0: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
  }),
  "bellstrikeUmbra-swordspecial-2-hit": withoutHitTriggers(withoutMeterGate(swordspecial2Hit), {
    0: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
    1: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
  }),
  "bellstrikeUmbra-swordspecial-3-hit": withoutHitTriggers(withoutMeterGate(swordspecial3Hit), {
    0: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
    1: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
    2: [INNER_BALANCE_STRIKE_III_BLEED_REFUND],
  }),
  "bellstrikeUmbra-sword-martial-qqq": withoutHitTriggers(swordMartialQqq, {
    0: [SWORD_MARTIAL_QQQ_BLEED_REFUND],
    1: [CRISSCROSS_ENDURANCE_GAIN, SWORD_MARTIAL_QQQ_BLEED_REFUND],
  }),
  "bellstrikeUmbra-sword-r-charge-follow-up": withoutHitTriggers(swordRChargeFollowUp, {
    0: [SWORD_R_CHARGE_FOLLOW_UP_BLEED_REFUND],
    1: [CRISSCROSS_ENDURANCE_GAIN, SWORD_R_CHARGE_FOLLOW_UP_BLEED_REFUND],
  }),
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel": withoutHitTriggers(
    swordRChargeFollowUp1HitCancel,
    { 0: [CRISSCROSS_ENDURANCE_GAIN, SWORD_R_CHARGE_FOLLOW_UP_BLEED_REFUND] },
  ),
  "universal-perfect-dodge": withoutHitTriggers(withoutMeterGate(perfectDodge), {
    0: [CALMWATERS_PERFECT_DODGE_GAIN, ...EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS],
  }),
  "universal-perfect-dodge-full": withoutHitTriggers(withoutMeterGate(perfectDodgeFull), {
    0: [CALMWATERS_PERFECT_DODGE_GAIN, ...EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS],
  }),
}

const CLASS_ID_OF: Record<string, string> = {
  "stonesplitStrength-phalanxspecial-prepull": "stonesplitStrength",
  "stonesplitStrength-anxisoldierheng-stab": "stonesplitStrength",
  "stonesplitStrength-anxisoldiermojump": "stonesplitStrength",
  "bellstrikeUmbra-swordspecial-1-hit": "bellstrikeUmbra",
  "bellstrikeUmbra-swordspecial-2-hit": "bellstrikeUmbra",
  "bellstrikeUmbra-swordspecial-3-hit": "bellstrikeUmbra",
  "bellstrikeUmbra-sword-martial-qqq": "bellstrikeUmbra",
  "bellstrikeUmbra-sword-r-charge-follow-up": "bellstrikeUmbra",
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel": "bellstrikeUmbra",
  "universal-perfect-dodge": "universal",
  "universal-perfect-dodge-full": "universal",
}

function beforeShapeOf(id: string): Skill {
  if (MISSING_FROM_FIXTURE_IDS.includes(id)) {
    return seedSkillFromBuiltin(CLASS_ID_OF[id]!, PRE_V38_BUILTINS[id]!)
  }
  return skillIn(STORE, id)
}

const ENDURANCE = "endurance"
const BLADE_MOMENTUM = "bladeMomentum"
const enduranceRequires = (op: string, stacks: number) => ({
  buffId: `meter:${ENDURANCE}`,
  op,
  stacks,
})
const bladeMomentumRequires = (op: string, stacks: number) => ({
  buffId: `meter:${BLADE_MOMENTUM}`,
  op,
  stacks,
})

const GRAVE_FROST_GAIN_SHAPE = { kind: "meterDelta", targetId: BLADE_MOMENTUM, stacks: 3.25 }
const QIANKUNS_LOCK_GAIN_SHAPE = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 30,
  condition: null,
}
const MOUNTAINS_MIGHT_GAIN_SHAPE = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 30,
  requiresParam: "mountainsMight",
}
const CRISSCROSS_ENDURANCE_GAIN_SHAPE = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 8,
  appliesOnCastEnd: true,
}
const SWORD_MORPH_ENDURANCE_SPEND_SHAPE = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: -20,
  meterSpendCapToCurrent: 20,
  recordSpendAsStatus: "swordMorphConvertedAmount",
}
const ANXI_SOLDIER_BLADE_MOMENTUM_GAIN_SHAPE = {
  kind: "meterDelta",
  targetId: BLADE_MOMENTUM,
  stacks: 2.5,
  cooldownFrames: 15,
  cooldownGroup: "anxiSoldierBladeMomentumGain",
}
const GAUNTLETS_PERFECT_DODGE_GAIN_SHAPE = { kind: "meterDelta", targetId: ENDURANCE, stacks: 5 }

function hasTrigger(triggers: unknown[], shape: Record<string, unknown>): boolean {
  const matcher = expect.objectContaining(shape) as unknown as {
    asymmetricMatch(x: unknown): boolean
  }
  return triggers.some((trigger) => matcher.asymmetricMatch(trigger))
}

interface Case {
  id: string
  assert: (healed: Skill) => void
}

// Every matchId V38 patches, minus the five already exercised above — each
// gets its own independently-asserted expected shape (drawn from the values
// documented for its in-game source), never a comparison against another
// call of `healSkill` on the same input.
const CASES: Case[] = [
  {
    id: "stonesplitStrength-snowpartingcharged-forgetfulness",
    assert: (healed) => {
      for (const hit of healed.hits)
        expect(hasTrigger(hit.triggers, GRAVE_FROST_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "stonesplitStrength-snowpartingvc",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: BLADE_MOMENTUM, amount: 25 }])
      expect(healed.castConditions).toEqual([
        { buffId: "snowbreakSpringAvailable", op: "gte", stacks: 1 },
        bladeMomentumRequires("gte", 25),
      ])
      expect(
        hasTrigger(healed.hits[0]!.triggers, {
          kind: "meterDelta",
          targetId: BLADE_MOMENTUM,
          stacks: 12.5,
          requiresParam: "frostCladNight",
          requiresMinTier: 3,
        }),
      ).toBe(true)
    },
  },
  {
    id: "stonesplitStrength-snowpartingvc-prepull",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: BLADE_MOMENTUM, amount: 25 }])
      expect(healed.castConditions).toEqual([
        { buffId: "snowbreakSpringAvailable", op: "gte", stacks: 1 },
        bladeMomentumRequires("gte", 25),
      ])
      expect(
        hasTrigger(healed.hits[0]!.triggers, {
          kind: "meterDelta",
          targetId: BLADE_MOMENTUM,
          stacks: 12.5,
          requiresParam: "frostCladNight",
          requiresMinTier: 3,
        }),
      ).toBe(true)
    },
  },
  {
    id: "stonesplitStrength-snowpartingspecial",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: BLADE_MOMENTUM, amount: 5 }])
      expect(healed.castConditions).toEqual([bladeMomentumRequires("gte", 50)])
    },
  },
  {
    id: "stonesplitStrength-phalanxspecial",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: BLADE_MOMENTUM, amount: 50 }])
      expect(healed.castConditions).toEqual([bladeMomentumRequires("gte", 50)])
    },
  },
  {
    id: "stonesplitStrength-phalanxspecial-prepull",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: BLADE_MOMENTUM, amount: 50 }])
      expect(healed.castConditions).toEqual([bladeMomentumRequires("gte", 50)])
    },
  },
  {
    id: "stonesplitStrength-phalanxcharged-s3",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: BLADE_MOMENTUM, amount: 50 }])
      expect(healed.castConditions).toEqual([bladeMomentumRequires("gt", 50)])
    },
  },
  {
    id: "stonesplitStrength-anxisoldierheng",
    assert: (healed) => {
      for (const hit of healed.hits)
        expect(hasTrigger(hit.triggers, ANXI_SOLDIER_BLADE_MOMENTUM_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "stonesplitStrength-anxisoldierheng-stab",
    assert: (healed) => {
      for (const hit of healed.hits)
        expect(hasTrigger(hit.triggers, ANXI_SOLDIER_BLADE_MOMENTUM_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "stonesplitStrength-anxisoldiermodown",
    assert: (healed) => {
      expect(hasTrigger(healed.hits[0]!.triggers, ANXI_SOLDIER_BLADE_MOMENTUM_GAIN_SHAPE)).toBe(
        true,
      )
    },
  },
  {
    id: "stonesplitStrength-anxisoldiermojump",
    assert: (healed) => {
      expect(hasTrigger(healed.hits[0]!.triggers, ANXI_SOLDIER_BLADE_MOMENTUM_GAIN_SHAPE)).toBe(
        true,
      )
    },
  },
  {
    id: "stonesplitStrength-anxisoldiermosweep",
    assert: (healed) => {
      expect(hasTrigger(healed.hits[0]!.triggers, ANXI_SOLDIER_BLADE_MOMENTUM_GAIN_SHAPE)).toBe(
        true,
      )
      expect(hasTrigger(healed.hits[1]!.triggers, ANXI_SOLDIER_BLADE_MOMENTUM_GAIN_SHAPE)).toBe(
        true,
      )
    },
  },
  {
    id: "stonesplitStrength-phalanxcharged-s3-innerpassion",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([
        {
          meterId: BLADE_MOMENTUM,
          amount: 25,
          requiresParam: "steadfastDevotion",
          requiresMaxTier: 3,
        },
      ])
      expect(healed.castConditions).toEqual([
        { anyOf: [{ param: "steadfastDevotion", minTier: 4 }, bladeMomentumRequires("gt", 25)] },
      ])
    },
  },
  {
    id: "bellstrikeSplendor-swordheavycharged-2-hit",
    assert: (healed) => {
      expect(healed.meterDrains).toEqual([
        { meterId: ENDURANCE, perSecond: 20, fromFrame: 12.6, stopAfterSec: 1.2 },
      ])
      expect(healed.meterFreezes).toEqual([{ meterId: ENDURANCE, fromFrame: 12 }])
      expect(hasTrigger(healed.hits[1]!.triggers, SWORD_MORPH_ENDURANCE_SPEND_SHAPE)).toBe(true)
    },
  },
  {
    id: "bellstrikeSplendor-swordheavycharged-prepull",
    assert: (healed) => {
      expect(healed.meterDrains).toEqual([
        { meterId: ENDURANCE, perSecond: 20, fromFrame: 12.6, stopAfterSec: 1.2 },
      ])
      expect(healed.meterFreezes).toEqual([{ meterId: ENDURANCE, fromFrame: 12 }])
      expect(hasTrigger(healed.hits[0]!.triggers, SWORD_MORPH_ENDURANCE_SPEND_SHAPE)).toBe(true)
    },
  },
  {
    id: "bellstrikeSplendor-energysurge",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 1 }])
      expect(hasTrigger(healed.hits[0]!.triggers, SWORD_MORPH_ENDURANCE_SPEND_SHAPE)).toBe(true)
    },
  },
  {
    id: "bellstrikeSplendor-spearq",
    assert: (healed) => {
      expect(hasTrigger(healed.hits[0]!.triggers, QIANKUNS_LOCK_GAIN_SHAPE)).toBe(true)
      expect(hasTrigger(healed.hits[0]!.triggers, MOUNTAINS_MIGHT_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "bellstrikeSplendor-spearq-prepull",
    assert: (healed) => {
      expect(hasTrigger(healed.hits[0]!.triggers, QIANKUNS_LOCK_GAIN_SHAPE)).toBe(true)
      expect(hasTrigger(healed.hits[0]!.triggers, MOUNTAINS_MIGHT_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "bellstrikeSplendor-spearq-0-hit-cancel",
    assert: (healed) => {
      expect(hasTrigger(healed.hits[0]!.triggers, QIANKUNS_LOCK_GAIN_SHAPE)).toBe(true)
      expect(hasTrigger(healed.hits[0]!.triggers, MOUNTAINS_MIGHT_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "bellstrikeUmbra-swordspecial-1-hit",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 40 }])
      expect(healed.castConditions).toEqual([enduranceRequires("gte", 50)])
    },
  },
  {
    id: "bellstrikeUmbra-swordspecial-2-hit",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 40 }])
      expect(healed.castConditions).toEqual([enduranceRequires("gte", 50)])
    },
  },
  {
    id: "bellstrikeUmbra-swordspecial-3-hit",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 40 }])
      expect(healed.castConditions).toEqual([enduranceRequires("gte", 50)])
    },
  },
  {
    id: "bellstrikeUmbra-swordspecial-4-hit",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 40 }])
      expect(healed.castConditions).toEqual([enduranceRequires("gte", 50)])
    },
  },
  {
    id: "bellstrikeUmbra-spearspecial",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 40 }])
      expect(healed.castConditions).toEqual([enduranceRequires("gte", 40)])
    },
  },
  {
    id: "bellstrikeUmbra-spearspecial-1-hit-cancel",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 40 }])
      expect(healed.castConditions).toEqual([enduranceRequires("gte", 40)])
    },
  },
  {
    id: "bellstrikeUmbra-sword-martial-qqq",
    assert: (healed) => {
      expect(hasTrigger(healed.hits[1]!.triggers, CRISSCROSS_ENDURANCE_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "bellstrikeUmbra-sword-r-charge-follow-up",
    assert: (healed) => {
      expect(hasTrigger(healed.hits[1]!.triggers, CRISSCROSS_ENDURANCE_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
    assert: (healed) => {
      expect(hasTrigger(healed.hits[0]!.triggers, CRISSCROSS_ENDURANCE_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "bellstrikeUmbra-crosswind-blade-cancel",
    assert: (healed) => {
      expect(hasTrigger(healed.hits[0]!.triggers, CRISSCROSS_ENDURANCE_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "bellstrikeSplendor-swordspecial",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 25 }])
      expect(healed.castConditions).toEqual([enduranceRequires("gte", 30)])
    },
  },
  {
    id: "bamboocutDraught-perfect-dodge-full",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 15 }])
      expect(healed.castConditions).toEqual([enduranceRequires("gte", 15)])
      expect(hasTrigger(healed.hits[0]!.triggers, GAUNTLETS_PERFECT_DODGE_GAIN_SHAPE)).toBe(true)
    },
  },
  {
    id: "universal-perfect-dodge",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 15 }])
      expect(healed.castConditions).toEqual([enduranceRequires("gte", 15)])
    },
  },
  {
    id: "universal-perfect-dodge-full",
    assert: (healed) => {
      expect(healed.meterCosts).toEqual([{ meterId: ENDURANCE, amount: 15 }])
      expect(healed.castConditions).toEqual([enduranceRequires("gte", 15)])
    },
  },
]

describe("custom-skills v37 fixture", () => {
  it("is v37 and stores the pre-V38 shape for every representative id", () => {
    expect(STORE.v).toBe(V38__meterFieldsAndGains.to - 1)
    for (const id of REPRESENTATIVE_IDS) {
      const skill = skillIn(STORE, id)
      expect(skill, id).toBeTruthy()
      expect(skill.meterCosts, id).toBeUndefined()
      expect(skill.meterDrains, id).toBeUndefined()
      expect(
        skill.hits.some((hit) => hit.triggers.some((trigger) => trigger.kind === "meterDelta")),
        id,
      ).toBe(false)
    }
  })

  it("stores the pre-V38 shape for every fixture-backed matchId, not just the representative ones", () => {
    for (const id of FIXTURE_BACKED_IDS) {
      const skill = skillIn(STORE, id)
      expect(skill.meterCosts, id).toBeUndefined()
      expect(skill.meterDrains, id).toBeUndefined()
      expect(
        skill.hits.some((hit) => hit.triggers.some((trigger) => trigger.kind === "meterDelta")),
        id,
      ).toBe(false)
    }
  })

  it("the seeded shape for every id missing from the fixture is also genuinely pre-V38", () => {
    for (const id of MISSING_FROM_FIXTURE_IDS) {
      const skill = beforeShapeOf(id)
      expect(skill.meterCosts, id).toBeUndefined()
      expect(skill.meterDrains, id).toBeUndefined()
      expect(
        skill.hits.some((hit) => hit.triggers.some((trigger) => trigger.kind === "meterDelta")),
        id,
      ).toBe(false)
    }
  })
})

describe("healSkill", () => {
  it("adds the skill-level cost and a gain on every hit for Grave Frost", () => {
    const healed = healSkill(
      clone(skillIn(STORE, "stonesplitStrength-snowpartingcharged")),
    ) as Skill
    expect(healed.meterCosts).toEqual([{ meterId: "endurance", amount: 15 }])
    for (const hit of healed.hits) {
      expect(
        hit.triggers.some(
          (trigger) => trigger.kind === "meterDelta" && trigger.targetId === "bladeMomentum",
        ),
      ).toBe(true)
    }
  })

  it("adds the drain, freeze and a condition-gated spend for Vagrant Sword", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeSplendor-swordheavycharged"))) as Skill
    expect(healed.meterDrains).toEqual([
      { meterId: "endurance", perSecond: 20, fromFrame: 12.6, stopAfterSec: 1.2 },
    ])
    expect(healed.meterFreezes).toEqual([{ meterId: "endurance", fromFrame: 12 }])
    const spend = healed.hits[2].triggers.find(
      (trigger) => trigger.kind === "meterDelta" && trigger.targetId === "endurance",
    )
    expect(spend?.condition).toEqual({ buffId: "swordMorphMultiWaveWindow", op: "gte", stacks: 1 })
  })

  it("adds an unconditional Endurance gain to Crosswind Blade's one hit", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeUmbra-crosswind-blade"))) as Skill
    expect(
      healed.hits[0].triggers.some(
        (trigger) => trigger.kind === "meterDelta" && trigger.stacks === 8,
      ),
    ).toBe(true)
  })

  it("adds the universal Perfect Dodge gain by id suffix, on any class", () => {
    const healed = healSkill(clone(skillIn(STORE, "bamboocutDraught-perfect-dodge"))) as Skill
    expect(
      healed.hits[0].triggers.some(
        (trigger) => trigger.kind === "meterDelta" && trigger.stacks === 5,
      ),
    ).toBe(true)
  })

  it("adds Forsaken Fame's drain, freeze and gain", () => {
    const healed = healSkill(clone(skillIn(STORE, "silkbindJade-fanlightcharged"))) as Skill
    expect(healed.meterDrains).toEqual([
      { meterId: "endurance", perSecond: 30, fromFrame: 14.4, stopAfterSec: 0.55 },
    ])
    expect(healed.meterFreezes).toEqual([{ meterId: "endurance", fromFrame: 0 }])
    const gain = healed.hits[0].triggers.find(
      (trigger) => trigger.kind === "meterDelta" && trigger.stacks === 10,
    )
    expect(gain?.appliesOnCastEnd).toBe(true)
  })

  it("does not double-heal a copy that already carries the fields", () => {
    const once = healSkill(clone(skillIn(STORE, "stonesplitStrength-snowpartingcharged"))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "stonesplitStrength-deflect")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe.each(CASES)("healSkill — $id", ({ id, assert }) => {
  it("adds exactly the shape this matchId patches in, asserted independently", () => {
    const healed = healSkill(clone(beforeShapeOf(id))) as Skill
    assert(healed)
  })

  it("does not double-heal a copy that already carries the added shape", () => {
    const once = healSkill(clone(beforeShapeOf(id))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })
})

describe("V38__meterFieldsAndGains — called directly", () => {
  it("heals every targeted matchId and leaves every other captured skill exactly as it was", () => {
    const after = V38__meterFieldsAndGains.migrate(clone(STORE))
    expect(after.v).toBe(38)
    for (const id of FIXTURE_BACKED_IDS) {
      const healed = skillIn(after, id)
      const hasMeterField =
        !!healed.meterCosts ||
        !!healed.meterDrains ||
        healed.hits.some((hit) => hit.triggers.some((trigger) => trigger.kind === "meterDelta"))
      expect(hasMeterField, id).toBe(true)
    }
    for (const skill of STORE.skills as Skill[]) {
      if (ALL_MATCH_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id), skill.id).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V38__meterFieldsAndGains.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V38__meterFieldsAndGains.migrate(clone(once))).toEqual(once)
  })
})

describe("V38__meterFieldsAndGains — through the chain", () => {
  it("is registered and is exactly what the v37 → v38 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V38__meterFieldsAndGains)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 38 })!
    expect(result.applied).toEqual(["V38__meterFieldsAndGains"])
    expect(result.blob.v).toBe(38)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter((step) => step !== V38__meterFieldsAndGains)
    const result = runChain(withoutStep, 38, clone(STORE))!
    expect(result.applied).not.toContain("V38__meterFieldsAndGains")
    expect(skillIn(result.blob, REPRESENTATIVE_IDS[0]).meterCosts).toBeUndefined()
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the fields after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find(
      (candidate) => candidate.id === "stonesplitStrength-snowpartingcharged",
    )!
    expect(skill.meterCosts).toEqual([{ meterId: "endurance", amount: 15 }])
  })

  it("keeps meterDrains, meterFreezes, meterSpendCapToCurrent and cooldownGroup after loadCustomSkills", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find(
      (candidate) => candidate.id === "bellstrikeSplendor-swordheavycharged",
    )!
    expect(skill.meterDrains).toEqual([
      { meterId: "endurance", perSecond: 20, fromFrame: 12.6, stopAfterSec: 1.2 },
    ])
    expect(skill.meterFreezes).toEqual([{ meterId: "endurance", fromFrame: 12 }])
    const spend = skill.hits[2]!.triggers.find(
      (trigger) => trigger.kind === "meterDelta" && trigger.targetId === "endurance",
    )
    expect(spend?.meterSpendCapToCurrent).toBe(20)
    expect(spend?.recordSpendAsStatus).toBe("swordMorphConvertedAmount")
  })

  it("keeps a meterDelta gain's cooldownGroup after loadCustomSkills", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === "stonesplitStrength-anxisoldierheng")!
    const gain = skill.hits[0]!.triggers.find(
      (trigger) => trigger.kind === "meterDelta" && trigger.targetId === "bladeMomentum",
    )
    expect(gain?.cooldownGroup).toBe("anxiSoldierBladeMomentumGain")
  })
})
