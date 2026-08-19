// Thunderous Bloom — Inner Way (Silkbind - Jade). Wiki spec:
//   Base:  When you move more than 15m within 3s, gain Spring Thunder: the
//          next 3 Heavy Attacks or Airborne Heavy Attacks within 12s gain
//          15% DMG Bonus. Effect may trigger once every 15 seconds.
//   Tier 1: Reduces the distance required to 12m.
//   Tier 2: Increases Physical attack based on Solo Mode Level.
//   Tier 3: Thunder of Awakening also grants 15% Qi DMG Bonus.
//   Tier 4: Heavy-attack charge cap 3 → 5.
//   Tier 5: Physical DMG Bonus +2.5% (so 15% → 17.5%).
//   Tier 6: While Spring Thunder is active, hitting a target that is
//           Exhausted or <30% Qi with a Heavy attack restores one stack.
//           ICD 2s.
//
// Placeholder (validated: false). The Spring Thunder debuff itself lives in
// src/data/skills/silkbind-jade/debuffs.ts and is registered on the
// silkbindJade class via debuffs. This file's tier table is what the engine
// reads for the inner-way's per-tier panelStats and node unlocks.
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"

export const THUNDEROUS_BLOOM_DISTANCE_BASE_M = 15
export const THUNDEROUS_BLOOM_DISTANCE_T1_M = 12
export const THUNDEROUS_BLOOM_MOVE_WINDOW_SEC = 3
export const THUNDEROUS_BLOOM_TRIGGER_ICD_SEC = 15
export const THUNDEROUS_BLOOM_PHYS_BOOST_BASE = 0.15
export const THUNDEROUS_BLOOM_PHYS_BOOST_T5 = 0.025
export const THUNDEROUS_BLOOM_HEAVY_CAP_BASE = 3
export const THUNDEROUS_BLOOM_HEAVY_CAP_T4 = 5
export const THUNDEROUS_BLOOM_QI_BOOST_T3 = 0.15
export const THUNDEROUS_BLOOM_T6_ICD_SEC = 2

export const thunderousBloom = defineInnerWay({
  id: INNER_WAY_ID.thunderousBloom,
  name: "Thunderous Bloom",
  legacyNames: ["Spring Thunder"],
  selectableTiers: [6, 5, 4, 3, 2, 1],
  // Tier 1: distance threshold drops 15m → 12m.
  // Tier 2: phys boost grows with Solo Mode Level (1.7 per level, base 5.1).
  // Tier 3: also grants Qi Damage Boost (15%).
  // Tier 4: heavy-attack charge cap 3 → 5.
  // Tier 5: phys DMG Bonus +2.5%.
  // Tier 6: stack restoration on Exhausted / <30% Qi hit.
  tiers: {
    1: { nodes: [INNER_WAY_NODE.thunderousBloomShortenedDistance] },
    2: { panelStats: { "phys.min": 1.7, "phys.max": 3.4 } },
    3: { panelStats: { qiDamageBoost: THUNDEROUS_BLOOM_QI_BOOST_T3 } },
    4: { nodes: [INNER_WAY_NODE.thunderousBloomRestoresStackOnExhausted] },
    5: { panelStats: { physBoost: THUNDEROUS_BLOOM_PHYS_BOOST_T5 } },
    6: { nodes: [INNER_WAY_NODE.thunderousBloomRestoresStackOnExhausted] },
  },
})
