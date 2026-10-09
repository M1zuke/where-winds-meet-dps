// v37 -> v38 — the Endurance and Blade Momentum meter: skill-level meter
// costs, drains and freezes, and per-hit meter-delta gains, on every built-in
// skill the in-game costs and gains name. Neither kind of field has an
// editable surface in the Skill Editor, so a stored copy is healed
// unconditionally, the same way an earlier hop heals trigger arrays.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

interface MeterCost {
  meterId: string
  amount: number
  requiresParam?: string
  requiresMinTier?: number
  requiresMaxTier?: number
}
interface MeterDrain {
  meterId: string
  perSecond: number
  fromFrame: number
  stopAfterSec?: number
}
interface MeterFreeze {
  meterId: string
  fromFrame: number
}
interface HitTrigger {
  kind: string
  targetId: string
  stacks: number
  condition: unknown
  [key: string]: unknown
}
type CastCondition = Record<string, unknown>

interface SkillMeterPatch {
  matchId: (id: string) => boolean
  meterCosts?: MeterCost[]
  meterDrains?: MeterDrain[]
  meterFreezes?: MeterFreeze[]
  // Appended to the skill's own `castConditions` only when not already
  // present (a structural match), never replacing an edited list.
  castConditions?: CastCondition[]
  // Index into the skill's own `hits` array -> the triggers that hit now
  // carries, appended after every trigger it already had.
  appendHitTriggers?: Record<number, HitTrigger[]>
}

const exact = (id: string) => (candidate: string) => candidate === id

const ENDURANCE = "endurance"
const BLADE_MOMENTUM = "bladeMomentum"

const GRAVE_FROST_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: BLADE_MOMENTUM,
  stacks: 3.25,
  condition: null,
}
const QIANKUNS_LOCK_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 30,
  condition: null,
}
const MOUNTAINS_MIGHT_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 30,
  condition: null,
  requiresParam: "mountainsMight",
}
const CRISSCROSS_ENDURANCE_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 8,
  condition: null,
  appliesOnCastEnd: true,
}
const SWORD_MORPH_ENDURANCE_SPEND: HitTrigger = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: -20,
  condition: null,
  meterSpendCapToCurrent: 20,
  recordSpendAsStatus: "swordMorphConvertedAmount",
}
const SWORD_MORPH_ENDURANCE_SPEND_MULTI_WAVE: HitTrigger = {
  ...SWORD_MORPH_ENDURANCE_SPEND,
  condition: { buffId: "swordMorphMultiWaveWindow", op: "gte", stacks: 1 },
}
const ANXI_SOLDIER_BLADE_MOMENTUM_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: BLADE_MOMENTUM,
  stacks: 2.5,
  condition: null,
  cooldownFrames: 15,
  cooldownGroup: "anxiSoldierBladeMomentumGain",
}
const GAUNTLETS_PERFECT_DODGE_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 5,
  condition: null,
}
const FANLIGHTCHARGED_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: ENDURANCE,
  stacks: 10,
  condition: null,
  appliesOnCastEnd: true,
}

const enduranceRequires = (op: string, stacks: number): CastCondition => ({
  buffId: `meter:${ENDURANCE}`,
  op,
  stacks,
})
const bladeMomentumRequires = (op: string, stacks: number): CastCondition => ({
  buffId: `meter:${BLADE_MOMENTUM}`,
  op,
  stacks,
})

const PATCHES: SkillMeterPatch[] = [
  {
    matchId: exact("stonesplitStrength-snowpartingcharged"),
    meterCosts: [{ meterId: ENDURANCE, amount: 15 }],
    castConditions: [enduranceRequires("gt", 15)],
    appendHitTriggers: {
      0: [GRAVE_FROST_GAIN],
      1: [GRAVE_FROST_GAIN],
      2: [GRAVE_FROST_GAIN],
      3: [GRAVE_FROST_GAIN],
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingcharged-forgetfulness"),
    appendHitTriggers: {
      0: [GRAVE_FROST_GAIN],
      1: [GRAVE_FROST_GAIN],
      2: [GRAVE_FROST_GAIN],
      3: [GRAVE_FROST_GAIN],
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingvc"),
    meterCosts: [{ meterId: BLADE_MOMENTUM, amount: 25 }],
    castConditions: [
      { buffId: "snowbreakSpringAvailable", op: "gte", stacks: 1 },
      bladeMomentumRequires("gte", 25),
    ],
    appendHitTriggers: {
      0: [
        {
          kind: "meterDelta",
          targetId: BLADE_MOMENTUM,
          stacks: 12.5,
          condition: null,
          requiresParam: "frostCladNight",
          requiresMinTier: 3,
        },
      ],
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingvc-prepull"),
    meterCosts: [{ meterId: BLADE_MOMENTUM, amount: 25 }],
    castConditions: [
      { buffId: "snowbreakSpringAvailable", op: "gte", stacks: 1 },
      bladeMomentumRequires("gte", 25),
    ],
    appendHitTriggers: {
      0: [
        {
          kind: "meterDelta",
          targetId: BLADE_MOMENTUM,
          stacks: 12.5,
          condition: null,
          requiresParam: "frostCladNight",
          requiresMinTier: 3,
        },
      ],
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingspecial"),
    meterCosts: [{ meterId: BLADE_MOMENTUM, amount: 5 }],
    castConditions: [bladeMomentumRequires("gte", 50)],
  },
  {
    matchId: exact("stonesplitStrength-phalanxspecial"),
    meterCosts: [{ meterId: BLADE_MOMENTUM, amount: 50 }],
    castConditions: [bladeMomentumRequires("gte", 50)],
  },
  {
    matchId: exact("stonesplitStrength-phalanxspecial-prepull"),
    meterCosts: [{ meterId: BLADE_MOMENTUM, amount: 50 }],
    castConditions: [bladeMomentumRequires("gte", 50)],
  },
  {
    matchId: exact("stonesplitStrength-phalanxcharged-s3"),
    meterCosts: [{ meterId: BLADE_MOMENTUM, amount: 50 }],
    castConditions: [bladeMomentumRequires("gt", 50)],
  },
  {
    matchId: exact("stonesplitStrength-anxisoldierheng"),
    appendHitTriggers: {
      0: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
      1: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
      2: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
      3: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
    },
  },
  {
    matchId: exact("stonesplitStrength-anxisoldierheng-stab"),
    appendHitTriggers: {
      0: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
      1: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
      2: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
      3: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
    },
  },
  {
    matchId: exact("stonesplitStrength-anxisoldiermodown"),
    appendHitTriggers: { 0: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN] },
  },
  {
    matchId: exact("stonesplitStrength-anxisoldiermojump"),
    appendHitTriggers: { 0: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN] },
  },
  {
    matchId: exact("stonesplitStrength-anxisoldiermosweep"),
    appendHitTriggers: {
      0: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
      1: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
    },
  },
  {
    matchId: exact("stonesplitStrength-phalanxcharged-s3-innerpassion"),
    meterCosts: [
      {
        meterId: BLADE_MOMENTUM,
        amount: 25,
        requiresParam: "steadfastDevotion",
        requiresMaxTier: 3,
      },
    ],
    castConditions: [
      { anyOf: [{ param: "steadfastDevotion", minTier: 4 }, bladeMomentumRequires("gt", 25)] },
    ],
  },
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged"),
    meterDrains: [{ meterId: ENDURANCE, perSecond: 20, fromFrame: 12.6, stopAfterSec: 1.2 }],
    meterFreezes: [{ meterId: ENDURANCE, fromFrame: 12 }],
    appendHitTriggers: { 2: [SWORD_MORPH_ENDURANCE_SPEND_MULTI_WAVE] },
  },
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged-2-hit"),
    meterDrains: [{ meterId: ENDURANCE, perSecond: 20, fromFrame: 12.6, stopAfterSec: 1.2 }],
    meterFreezes: [{ meterId: ENDURANCE, fromFrame: 12 }],
    appendHitTriggers: { 1: [SWORD_MORPH_ENDURANCE_SPEND] },
  },
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged-prepull"),
    meterDrains: [{ meterId: ENDURANCE, perSecond: 20, fromFrame: 12.6, stopAfterSec: 1.2 }],
    meterFreezes: [{ meterId: ENDURANCE, fromFrame: 12 }],
    appendHitTriggers: { 0: [SWORD_MORPH_ENDURANCE_SPEND] },
  },
  {
    matchId: exact("bellstrikeSplendor-energysurge"),
    meterCosts: [{ meterId: ENDURANCE, amount: 1 }],
    appendHitTriggers: { 0: [SWORD_MORPH_ENDURANCE_SPEND] },
  },
  {
    matchId: exact("bellstrikeSplendor-spearq"),
    appendHitTriggers: { 0: [QIANKUNS_LOCK_GAIN, MOUNTAINS_MIGHT_GAIN] },
  },
  {
    matchId: exact("bellstrikeSplendor-spearq-prepull"),
    appendHitTriggers: { 0: [QIANKUNS_LOCK_GAIN, MOUNTAINS_MIGHT_GAIN] },
  },
  {
    matchId: exact("bellstrikeSplendor-spearq-0-hit-cancel"),
    appendHitTriggers: { 0: [QIANKUNS_LOCK_GAIN, MOUNTAINS_MIGHT_GAIN] },
  },
  {
    matchId: exact("bellstrikeUmbra-swordspecial-1-hit"),
    meterCosts: [{ meterId: ENDURANCE, amount: 40 }],
    castConditions: [enduranceRequires("gte", 50)],
  },
  {
    matchId: exact("bellstrikeUmbra-swordspecial-2-hit"),
    meterCosts: [{ meterId: ENDURANCE, amount: 40 }],
    castConditions: [enduranceRequires("gte", 50)],
  },
  {
    matchId: exact("bellstrikeUmbra-swordspecial-3-hit"),
    meterCosts: [{ meterId: ENDURANCE, amount: 40 }],
    castConditions: [enduranceRequires("gte", 50)],
  },
  {
    matchId: exact("bellstrikeUmbra-swordspecial-4-hit"),
    meterCosts: [{ meterId: ENDURANCE, amount: 40 }],
    castConditions: [enduranceRequires("gte", 50)],
  },
  {
    matchId: exact("bellstrikeUmbra-spearspecial"),
    meterCosts: [{ meterId: ENDURANCE, amount: 40 }],
    castConditions: [enduranceRequires("gte", 40)],
  },
  {
    matchId: exact("bellstrikeUmbra-spearspecial-1-hit-cancel"),
    meterCosts: [{ meterId: ENDURANCE, amount: 40 }],
    castConditions: [enduranceRequires("gte", 40)],
  },
  {
    matchId: exact("bellstrikeUmbra-sword-martial-qqq"),
    appendHitTriggers: { 1: [CRISSCROSS_ENDURANCE_GAIN] },
  },
  {
    matchId: exact("bellstrikeUmbra-sword-r-charge-follow-up"),
    appendHitTriggers: { 1: [CRISSCROSS_ENDURANCE_GAIN] },
  },
  {
    matchId: exact("bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel"),
    appendHitTriggers: { 0: [CRISSCROSS_ENDURANCE_GAIN] },
  },
  {
    matchId: exact("bellstrikeUmbra-crosswind-blade"),
    appendHitTriggers: { 0: [CRISSCROSS_ENDURANCE_GAIN] },
  },
  {
    matchId: exact("bellstrikeUmbra-crosswind-blade-cancel"),
    appendHitTriggers: { 0: [CRISSCROSS_ENDURANCE_GAIN] },
  },
  {
    matchId: exact("bellstrikeSplendor-swordspecial"),
    meterCosts: [{ meterId: ENDURANCE, amount: 25 }],
    castConditions: [enduranceRequires("gte", 30)],
  },
  {
    matchId: exact("silkbindJade-fanlightcharged"),
    meterDrains: [{ meterId: ENDURANCE, perSecond: 30, fromFrame: 14.4, stopAfterSec: 0.55 }],
    meterFreezes: [{ meterId: ENDURANCE, fromFrame: 0 }],
    appendHitTriggers: { 0: [FANLIGHTCHARGED_GAIN] },
  },
  {
    matchId: exact("bamboocutDraught-perfect-dodge"),
    meterCosts: [{ meterId: ENDURANCE, amount: 15 }],
    castConditions: [enduranceRequires("gte", 15)],
    appendHitTriggers: { 0: [GAUNTLETS_PERFECT_DODGE_GAIN] },
  },
  {
    matchId: exact("bamboocutDraught-perfect-dodge-full"),
    meterCosts: [{ meterId: ENDURANCE, amount: 15 }],
    castConditions: [enduranceRequires("gte", 15)],
    appendHitTriggers: { 0: [GAUNTLETS_PERFECT_DODGE_GAIN] },
  },
  {
    matchId: exact("universal-perfect-dodge"),
    meterCosts: [{ meterId: ENDURANCE, amount: 15 }],
    castConditions: [enduranceRequires("gte", 15)],
  },
  {
    matchId: exact("universal-perfect-dodge-full"),
    meterCosts: [{ meterId: ENDURANCE, amount: 15 }],
    castConditions: [enduranceRequires("gte", 15)],
  },
]

function alreadyHasMeterDelta(triggers: unknown, targetId: string): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) && trigger.kind === "meterDelta" && trigger.targetId === targetId,
    )
  )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const patch = PATCHES.find((candidate) => candidate.matchId(skill.id as string))
  if (!patch) return skill

  const next: Record<string, unknown> = { ...skill }
  if (patch.meterCosts && next.meterCosts === undefined) next.meterCosts = patch.meterCosts
  if (patch.meterDrains && next.meterDrains === undefined) next.meterDrains = patch.meterDrains
  if (patch.meterFreezes && next.meterFreezes === undefined) next.meterFreezes = patch.meterFreezes

  if (patch.castConditions) {
    const existing = Array.isArray(skill.castConditions) ? skill.castConditions : []
    const missing = patch.castConditions.filter(
      (condition) => !existing.some((entry) => JSON.stringify(entry) === JSON.stringify(condition)),
    )
    if (missing.length > 0) next.castConditions = [...existing, ...missing]
  }

  if (patch.appendHitTriggers && Array.isArray(skill.hits)) {
    next.hits = skill.hits.map((hit, index) => {
      const additions = patch.appendHitTriggers?.[index]
      if (!additions || !isRecord(hit)) return hit
      const existingTriggers = Array.isArray(hit.triggers) ? hit.triggers : []
      const missing = additions.filter(
        (addition) => !alreadyHasMeterDelta(existingTriggers, addition.targetId),
      )
      if (missing.length === 0) return hit
      return { ...hit, triggers: [...existingTriggers, ...missing] }
    })
  }

  return next
}

export const V38__meterFieldsAndGains: CustomSkillMigration = {
  to: 38,
  name: "V38__meterFieldsAndGains",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 38, skills }
  },
}
