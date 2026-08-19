// Star Reacher — Inner Way (Silkbind - Jade). In-game text (2026-08-19):
//   Base:  Gain 5% Physical Attack bonus for up to 8 seconds after applying
//          Lingering Bone Mark to an enemy. This bonus can only be gained
//          once per second, and gaining it again will refresh its duration.
//          Knocking a target Airborne increases the Physical Attack bonus
//          to 10%.
//   Tier 1: When damaging an airborne target with Lingering Bone applied by
//           you, deal 3% more damage if your HP is above 75%; if your HP
//           is below or equal to 75%, restore HP equal to 10% of the damage
//           instead.
//   Tier 2: Increases Physical Penetration by 5.1%.
//   Tier 3: Increases the duration of the Physical Attack bonus to 12s.
//   Tier 4: Gain Physical Attack bonus against targets who are Exhausted or
//           have Qi below 30% (15% and 25% bonus respectively).
//   Tier 5: Increases Physical Attack based on Solo Mode Level.
//   Tier 6: Increases the Physical Attack bonuses after applying Lingering
//           Bone and knocking a target airborne to 7.5% and 15%
//           respectively.
//
// Placeholder (validated: false). T2 (flat phys penetration) and T5
// (Solo Mode Level phys-attack scaler) ride the per-tier `panelStats` block
// the way Thunderous Bloom T2 does. T3 / T4 / T6 are gated by nodes and
// consumed by `starReacherBuffs.ts`:
//   - T3 (`starReacherExtendedDuration`) widens the buff duration 8s → 12s.
//   - T6 (`starReacherRaisedBaseBonuses`) raises the bonus magnitudes from
//     5%/10% to 7.5%/15%, AND the airborne-doubled variant (10% → 15%) is
//     now reachable via `EffectContext.target.airborne`.
//   - T4 (`starReacherExhaustedBonus`) adds +15% phys on Exhausted and
//     +25% on <30% Qi via `EffectContext.target.phase`.
//   - T1 (`starReacherHpGatedLingeringBone`) is still flagged but the
//     engine does not yet expose player HP at hit time, and there is no
//     heal-output lane — T1 needs a separate engine-work item before it
//     can fire. The buff module reads its existence so the def round-trips
//     cleanly with `innerWayHasNode`.
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { PARAM } from "../skills/buffs/ids"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { starReacherLingeringBoneBuff } from "./starReacherBuffs"

export const STAR_REACHER_BONUS_BASE = 0.05
export const STAR_REACHER_BONUS_AIRBORNE_BASE = 0.1
export const STAR_REACHER_BONUS_RAISED = 0.075
export const STAR_REACHER_BONUS_AIRBORNE_RAISED = 0.15
export const STAR_REACHER_DURATION_BASE_SEC = 8
export const STAR_REACHER_DURATION_T3_SEC = 12
export const STAR_REACHER_PHYS_PEN_T2 = 0.051
export const STAR_REACHER_EXHAUSTED_PHYS_BONUS_T4 = 0.15
export const STAR_REACHER_BELOW30_PHYS_BONUS_T4 = 0.25
export const STAR_REACHER_HP_GATE_THRESHOLD = 0.75
export const STAR_REACHER_HP_GATE_DAMAGE_BONUS_T1 = 0.03
export const STAR_REACHER_HP_GATE_HEAL_FRACTION_T1 = 0.1

export const starReacher = defineInnerWay({
  id: INNER_WAY_ID.starReacher,
  name: "Star Reacher",
  legacyNames: [],
  buffParam: PARAM.starReacher,
  // T1 is intentionally omitted from `selectableTiers` until the engine
  // exposes player HP at hit time and ships a heal-output lane (see the
  // header block above). Re-add `1` when the engine work lands.
  selectableTiers: [6, 5, 4, 3, 2],
  // Tier 2: flat 5.1% physical penetration (matches Insightful Strike's
  // panelStats convention for flat phys.penetration).
  // Tier 5: phys attack scales with Solo Mode Level, modelled the same way
  // Thunderous Bloom T2 models its per-level phys min/max contribution —
  // the engine currently treats these as static, so the values here are
  // the per-level coefficients the engine will multiply once per-level
  // scaling ships.
  tiers: {
    1: { nodes: [INNER_WAY_NODE.starReacherHpGatedLingeringBone] },
    2: { panelStats: { "phys.penetration": STAR_REACHER_PHYS_PEN_T2 } },
    3: { nodes: [INNER_WAY_NODE.starReacherExtendedDuration] },
    4: { nodes: [INNER_WAY_NODE.starReacherExhaustedBonus] },
    5: { panelStats: { "phys.min": 1.7, "phys.max": 3.4 } },
    6: { nodes: [INNER_WAY_NODE.starReacherRaisedBaseBonuses] },
  },
  buffDefs: [starReacherLingeringBoneBuff()],
})
