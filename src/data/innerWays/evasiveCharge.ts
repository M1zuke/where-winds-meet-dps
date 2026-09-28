import {
  defineInnerWay,
  defineInnerWayGateBuff,
  type InnerWayGateBuff,
} from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { WEAPON } from "../skills/ids"
import { enduranceMeter } from "../resources/enduranceMeter"

// In-game values as of 2026-09-28: ranks 3-6 all cut every dodge's own
// Endurance cost by a flat 20%, scoped to the Perfect Dodge skills' own
// `weapon:none` tag — the only tag those skills carry, since a dodge has no
// weapon of its own.
export const EVASIVE_CHARGE_DODGE_COST_REDUCTION_GATE: InnerWayGateBuff = defineInnerWayGateBuff({
  id: BUFF.evasiveChargeDodgeCostReduction,
  name: "Evasive Charge — Dodge Cost Reduction",
  description: "Perfect Dodge's own Endurance cost -20% from rank 3.",
  scope: "player",
  activation: "permanent",
  durationFrames: 1,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.evasiveCharge,
  requiresMinTier: 3,
  meterModifiers: [
    {
      meterId: enduranceMeter.id,
      kind: "cost",
      amount: -0.2,
      alwaysActive: true,
      tag: WEAPON.none,
    },
  ],
  createdAt: "2026-09-28T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})

// The damage-taken reduction, the Max HP heal and the extended Invincibility
// duration this inner way also grants have no player HP or incoming-damage
// resource in this app to apply to, so only the Endurance side (the refund on
// `perfect-dodge*.ts` and this cost cut) is modelled.
export const evasiveCharge = defineInnerWay({
  id: INNER_WAY_ID.evasiveCharge,
  name: "Evasive Charge",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.evasiveCharge,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.precisionFourStar },
  },
  gateBuffs: [EVASIVE_CHARGE_DODGE_COST_REDUCTION_GATE],
})
