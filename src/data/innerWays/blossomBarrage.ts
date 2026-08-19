// Blossom Barrage — Inner Way (Silkbind - Jade). In-game text (2026-08-19,
// all tiers at T6). The wiki's "T1 Combo 10% → 20%" and "T3 Combo 10s → 15s /
// +30% cast speed" raises were wiki misreads — the in-game Base Buff
// paragraph at T6 already shows 20% / 15s / +30% cast speed / 2 charges as
// the unconditional values when slotted. Players almost universally run
// this at T6; lower-tier behavior is unmodeled and undocumented in the
// in-game tooltips.
//
//   Base (when slotted): Spring Sorrow holds 2 charges, cast speed +30%.
//          Hitting a target applies Combo: +20% damage taken from the
//          caster's Projectile Skills for 15s. Affected Projectile Skills:
//          Spring Sorrow, Let Spring Go, Everbloom, Umbrella Light, Spring
//          Away (charged).
//   Tier 2: Crit Rate based on Solo Mode Level.
//   Tier 4: In non-Arena modes, when Spring Away hits a target with Combo
//           from you, its damage is +5% (+10% if Exhausted) and max targets
//           3 → 5.
//   Tier 5: Direct Crit Rate +4.6%.
//   Tier 6: Spring Sorrow charges 2 → 3. Hitting an enemy with Combo from
//           you reduces Spring Sorrow's cooldown by 5s and grants 25
//           Blossoms. Once per skill cast.
//
// Placeholder (validated: false). The Combo debuff and the multi-hit gating
// are gluing inner-way reads against the silkbindJade class's debuffs and
// skills. The tier table only carries values that scale with the panel.
// T1 was dropped because the in-game Base Buff paragraph already encodes
// what the wiki described as T1 / T3 raises.
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"

// Unconditional values when Blossom Barrage is slotted (T6 in practice;
// lower-tier behavior is unmodeled).
export const BLOSSOM_BARRAGE_COMBO_BOOST = 0.2
export const BLOSSOM_BARRAGE_COMBO_DURATION_SEC = 15
export const BLOSSOM_BARRAGE_CAST_SPEED = 0.3
export const BLOSSOM_BARRAGE_SPRING_SORROW_CHARGES = 3

// Tier-gated values.
export const BLOSSOM_BARRAGE_SPRING_AWAY_DAMAGE_T4 = 0.05
export const BLOSSOM_BARRAGE_SPRING_AWAY_DAMAGE_EXHAUSTED_T4 = 0.1
export const BLOSSOM_BARRAGE_SPRING_AWAY_TARGETS_T4 = 5
export const BLOSSOM_BARRAGE_SPRING_AWAY_TARGETS_BASE = 3
export const BLOSSOM_BARRAGE_DIRECT_CRIT_T5 = 0.046
export const BLOSSOM_BARRAGE_BLOSSOMS_T6 = 25
export const BLOSSOM_BARRAGE_COOLDOWN_REDUCTION_T6_SEC = 5

export const blossomBarrage = defineInnerWay({
  id: INNER_WAY_ID.blossomBarrage,
  name: "Blossom Barrage",
  legacyNames: [],
  // T1 omitted — see header block. Re-add if a future patch introduces a
  // genuine T1 raise.
  selectableTiers: [6, 5, 4, 3, 2],
  // Tier 2: crit rate based on Solo Mode Level (per-level coefficient
  //         currently encoded as a static 0.014 — see Star Reacher T5 for
  //         the same caveat about per-level scaling not yet shipping).
  // Tier 3: dropped (see header).
  // Tier 4: Spring Away damage +5% (+10% on Exhausted) on Combo'd targets;
  //         targets 3 → 5.
  // Tier 5: direct crit rate +4.6%.
  // Tier 6: Spring Sorrow charges 2 → 3; on Combo'd hit, -5s CD + 25 Blossoms
  //         (once per skill cast).
  tiers: {
    2: {
      panelStats: { critRate: 0.014 },
      // The 0.014 crit-rate value is a PER-LEVEL coefficient, scaled by
      // `Inputs.soloModeLevel` at resolution time. A player at Solo Mode
      // Level 6 picks up 8.4% crit rate from this tier (see
      // `InnerWayTier.scaleBySoloModeLevel`).
      scaleBySoloModeLevel: true,
    },
    3: {
      nodes: [INNER_WAY_NODE.blossomBarrageLongerCombo],
    },
    4: { nodes: [INNER_WAY_NODE.blossomBarrageSpringAwayBoost] },
    5: { panelStats: { directCritRate: BLOSSOM_BARRAGE_DIRECT_CRIT_T5 } },
    6: { nodes: [INNER_WAY_NODE.blossomBarrageSpringSorrowTripleCharge] },
  },
})
