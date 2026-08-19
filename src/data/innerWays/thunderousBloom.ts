// Thunderous Bloom — Inner Way (Silkbind - Jade). Wiki + in-game spec:
//   Base:  When you move more than 15m within 3s, gain Spring Thunder: the
//          next 3 Heavy Attacks within 12s gain 15% Physical DMG Bonus.
//          Effect may trigger once every 15 seconds.
//   Tier 1: Stacks gained per trigger raised 3 → 4.
//   Tier 2: Physical attack scales with Solo Mode Level.
//   Tier 3: Extends the duration of the HP Damage increase granted by
//           consuming each stack of Spring Thunder to 2 seconds.
//   Tier 4: Stacks gained per trigger raised 3 → 5.
//   Tier 5: Physical DMG Bonus +2.5% (so 15% → 17.5%).
//   Tier 6: While Spring Thunder is active, hitting a target that is
//           Exhausted or <30% Qi with a Heavy Attack, Heavy Attack Pursuit,
//           Light Attack, or Ballistic Skill restores 1 stack. Cooldown 2s.
//
// Placeholder (validated: false). The Spring Thunder debuff itself lives in
// src/data/skills/silkbind-jade/debuffs.ts and is registered on the
// silkbindJade class via debuffs. This file's tier table is what the engine
// reads for the inner-way's per-tier panelStats and node unlocks.
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"

export const THUNDEROUS_BLOOM_DISTANCE_BASE_M = 15
export const THUNDEROUS_BLOOM_MOVE_WINDOW_SEC = 3
export const THUNDEROUS_BLOOM_TRIGGER_ICD_SEC = 15
export const THUNDEROUS_BLOOM_PHYS_BOOST_BASE = 0.15
export const THUNDEROUS_BLOOM_PHYS_BOOST_T5 = 0.025
export const THUNDEROUS_BLOOM_STACKS_BASE = 3
export const THUNDEROUS_BLOOM_STACKS_T1 = 4
export const THUNDEROUS_BLOOM_STACKS_T4 = 5
export const THUNDEROUS_BLOOM_PER_STACK_DURATION_BASE_SEC = 1
export const THUNDEROUS_BLOOM_PER_STACK_DURATION_T3_SEC = 2
export const THUNDEROUS_BLOOM_T6_ICD_SEC = 2

export const thunderousBloom = defineInnerWay({
  id: INNER_WAY_ID.thunderousBloom,
  name: "Thunderous Bloom",
  legacyNames: ["Spring Thunder"],
  selectableTiers: [6, 5, 4, 3, 2, 1],
  // Tier 1: stacks gained per trigger 3 → 4.
  // Tier 2: physical attack scales with Solo Mode Level.
  // Tier 3: per-stack HP-Damage window extended to 2s.
  // Tier 4: stacks gained per trigger 3 → 5.
  // Tier 5: physBoost +2.5%.
  // Tier 6: stack restoration on Exhausted / <30% Qi hit (Heavy / Heavy
  //         Pursuit / Light / Ballistic).
  tiers: {
    1: { nodes: [INNER_WAY_NODE.thunderousBloomIncreasedStackGrant] },
    2: {
      panelStats: { "phys.min": 1.7, "phys.max": 3.4 },
      // The 1.7/3.4 phys min/max values above are PER-LEVEL coefficients,
      // scaled by `Inputs.soloModeLevel` at resolution time (see
      // `InnerWayTier.scaleBySoloModeLevel`). A player at Solo Mode Level 6
      // picks up 10.2 phys min / 20.4 phys max from this tier.
      scaleBySoloModeLevel: true,
    },
    3: { nodes: [INNER_WAY_NODE.thunderousBloomExtendedDamageWindow] },
    4: { nodes: [INNER_WAY_NODE.thunderousBloomIncreasedStackGrant] },
    5: { panelStats: { physBoost: THUNDEROUS_BLOOM_PHYS_BOOST_T5 } },
    6: { nodes: [INNER_WAY_NODE.thunderousBloomRestoresStackOnExhausted] },
  },
})
