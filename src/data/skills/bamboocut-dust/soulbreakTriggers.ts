import {
  applyBuff,
  applyDebuff,
  clearStatus,
  releaseEcho,
} from "../../../definitions/skills/triggers"
import type { HitTrigger, TriggerCondition } from "../../../engine/skill"
import { SOUL_RETURN_TOWLINE_SWEEP_DURATION_FRAMES } from "../../classes/bamboocut-dust/gates"
import { PARAM } from "../buffs/ids"
import {
  SOUL_LOSS_STACKS_FOR_SOULBREAK,
  SOULBREAK_PAYOUT_FIVE_PERCENT_MIN_TIER,
  SOULBREAK_PAYOUT_TEN_PERCENT_MIN_TIER,
  SOULBREAK_TOWLINE_SWEEP_DURATION_FRAMES,
} from "./debuffs"
import { DEBUFF, STATUS } from "./ids"

type TriggerSpec = Parameters<typeof applyBuff>[0]

interface TowlineRequirement {
  minTier?: number
}

interface GrantSpec {
  conditions?: TriggerCondition[]
  cooldownGroup?: string
  requiresTowline?: TowlineRequirement
}

const GRANT_COOLDOWN_FRAMES = 60
const BURN_AND_BURY_REFRESH_MIN_TIER = 6

const SOUL_RETURN_ON_SOULBREAK_GROUP = "bamboocutDust:soulReturnOnSoulbreak"
const SOUL_RETURN_ON_SIX_STACKS_GROUP = "bamboocutDust:soulReturnOnSixStacks"
const SOUL_RETURN_ON_FIVE_STACKS_GROUP = "bamboocutDust:soulReturnOnFiveStacks"

const soulLossAtLeast = (stacks: number): TriggerCondition => ({
  buffId: DEBUFF.soulLoss,
  op: "gte",
  stacks,
})

const SOUL_LOSS_AT_CAP = soulLossAtLeast(SOUL_LOSS_STACKS_FOR_SOULBREAK)
const SOUL_LOSS_LAPSED: TriggerCondition = { buffId: DEBUFF.soulLoss, op: "lt", stacks: 1 }
const SOULBREAK_UP: TriggerCondition = { buffId: DEBUFF.soulbreak, op: "gte", stacks: 1 }
const SOULBOUND_RELEASE_UP: TriggerCondition = {
  buffId: STATUS.soulboundRelease,
  op: "gte",
  stacks: 1,
}

function towlineGate(requirement: TowlineRequirement | undefined): Partial<TriggerSpec> {
  if (!requirement) return {}
  return {
    requiresParam: PARAM.towlineSweep,
    ...(requirement.minTier !== undefined ? { requiresMinTier: requirement.minTier } : {}),
  }
}

// The base duration rides the status; Towline Sweep adds a second grant that
// lasts 21 s, and the ledger unions the two windows.
function longerWithTowlineSweep(
  grant: (spec: TriggerSpec) => HitTrigger,
  target: string,
  towlineDurationFrames: number,
  spec: GrantSpec,
): HitTrigger[] {
  const shared: TriggerSpec = {
    target,
    ...(spec.conditions ? { conditions: spec.conditions } : {}),
    ...(spec.cooldownGroup
      ? { cooldownFrames: GRANT_COOLDOWN_FRAMES, cooldownGroup: spec.cooldownGroup }
      : {}),
  }
  return [
    grant({ ...shared, ...towlineGate(spec.requiresTowline) }),
    grant({
      ...shared,
      durationFrames: towlineDurationFrames,
      ...towlineGate(spec.requiresTowline ?? {}),
    }),
  ]
}

function soulbreakGrants(spec: GrantSpec): HitTrigger[] {
  return longerWithTowlineSweep(
    applyDebuff,
    DEBUFF.soulbreak,
    SOULBREAK_TOWLINE_SWEEP_DURATION_FRAMES,
    spec,
  )
}

function soulReturnGrants(spec: GrantSpec): HitTrigger[] {
  return longerWithTowlineSweep(
    applyBuff,
    STATUS.soulReturn,
    SOUL_RETURN_TOWLINE_SWEEP_DURATION_FRAMES,
    spec,
  )
}

function payoutMarkerGrant(
  target: string,
  minTier: number,
  conditions: TriggerCondition[],
): HitTrigger {
  return applyDebuff({
    target,
    conditions,
    requiresParam: PARAM.towlineSweep,
    requiresMinTier: minTier,
  })
}

function soulbreakConversion(): HitTrigger[] {
  const atCap = [SOUL_LOSS_AT_CAP]
  return [
    ...soulbreakGrants({ conditions: atCap }),
    payoutMarkerGrant(
      DEBUFF.soulbreakPayoutFivePercent,
      SOULBREAK_PAYOUT_FIVE_PERCENT_MIN_TIER,
      atCap,
    ),
    payoutMarkerGrant(
      DEBUFF.soulbreakPayoutTenPercent,
      SOULBREAK_PAYOUT_TEN_PERCENT_MIN_TIER,
      atCap,
    ),
    ...soulReturnGrants({ conditions: atCap, cooldownGroup: SOUL_RETURN_ON_SOULBREAK_GROUP }),
    applyDebuff({
      target: DEBUFF.soulLoss,
      stacks: -SOUL_LOSS_STACKS_FOR_SOULBREAK,
      conditions: atCap,
    }),
  ]
}

interface SoulLossApplication {
  conditions?: TriggerCondition[]
  requiresTowline?: TowlineRequirement
}

// Order matters: every trigger of a hit reads the ledger the previous one wrote.
function soulLossStep(application: SoulLossApplication): HitTrigger[] {
  return [
    applyDebuff({
      target: DEBUFF.soulLoss,
      ...(application.conditions ? { conditions: application.conditions } : {}),
      ...towlineGate(application.requiresTowline),
    }),
    ...soulbreakConversion(),
  ]
}

// A debuff's stack count does not lapse with its window, so an application
// after the window closed starts from zero here.
function resetLapsedSoulLoss(): HitTrigger {
  return clearStatus({ target: DEBUFF.soulLoss, condition: SOUL_LOSS_LAPSED })
}

function soulReturnAtStacks(
  stacks: number,
  cooldownGroup: string,
  requiresTowline?: TowlineRequirement,
): HitTrigger[] {
  return soulReturnGrants({ conditions: [soulLossAtLeast(stacks)], cooldownGroup, requiresTowline })
}

export function soulSweepHitTriggers(): HitTrigger[] {
  return [
    resetLapsedSoulLoss(),
    ...soulReturnAtStacks(6, SOUL_RETURN_ON_SIX_STACKS_GROUP),
    ...soulLossStep({}),
  ]
}

export function piercingDartSweepTriggers(): HitTrigger[] {
  return [
    resetLapsedSoulLoss(),
    ...soulReturnAtStacks(6, SOUL_RETURN_ON_SIX_STACKS_GROUP),
    ...soulReturnAtStacks(5, SOUL_RETURN_ON_FIVE_STACKS_GROUP, {}),
    ...soulLossStep({ conditions: [SOULBOUND_RELEASE_UP] }),
    ...soulLossStep({ requiresTowline: {} }),
  ]
}

export function burnAndBuryRankSixTriggers(): HitTrigger[] {
  const onSoulbreakTarget = [SOULBREAK_UP]
  const rankSix = { minTier: BURN_AND_BURY_REFRESH_MIN_TIER }
  return [
    releaseEcho({
      target: DEBUFF.soulbreakPayoutTenPercent,
      conditions: onSoulbreakTarget,
      requiresParam: PARAM.towlineSweep,
      requiresMinTier: BURN_AND_BURY_REFRESH_MIN_TIER,
    }),
    ...soulbreakGrants({ conditions: onSoulbreakTarget, requiresTowline: rankSix }),
    payoutMarkerGrant(
      DEBUFF.soulbreakPayoutTenPercent,
      BURN_AND_BURY_REFRESH_MIN_TIER,
      onSoulbreakTarget,
    ),
    ...soulReturnGrants({ conditions: onSoulbreakTarget, requiresTowline: rankSix }),
  ]
}
