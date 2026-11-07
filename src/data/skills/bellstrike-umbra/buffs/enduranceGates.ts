import type { MeterCost } from "../../../../engine/skill"
import { enduranceMeter, enduranceRequires } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-25: Inner Balance Strike III needs 50 and
// costs 40; Sweep All needs 40 and costs 40.
export const INNER_BALANCE_STRIKE_III_REQUIRES = enduranceRequires("gte", 50)
export const INNER_BALANCE_STRIKE_III_COST: MeterCost = { meterId: enduranceMeter.id, amount: 40 }
export const SWEEP_ALL_REQUIRES = enduranceRequires("gte", 40)
export const SWEEP_ALL_COST: MeterCost = { meterId: enduranceMeter.id, amount: 40 }
