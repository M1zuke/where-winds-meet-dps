// Blossom Barrage — Inner Way (Silkbind - Jade). Wiki spec:
//   Base:  Vernal Umbrella's Martial Arts Skill Spring Sorrow can hold up to 2
//          stacks. Hitting a target applies the Combo effect: increases
//          damage taken from the caster's Ballistic Skills by 10% for 10s.
//          Affected Ballistic Skills: Spring Sorrow, Let Spring Go, Everbloom,
//          Umbrella - Light Attack, Spring Away (charged).
//   Tier 1: Ballistic damage bonus from Combo 10% → 20%.
//   Tier 2: Crit Rate based on Solo Mode Level.
//   Tier 3: Spring Sorrow cast speed +30%, Combo duration 10s → 15s.
//   Tier 4: In non-Arena modes, when Spring Away hits a target with Combo
//           from you, its damage is +10% and max targets 3 → 5.
//   Tier 5: Crit Damage Bonus +4.4%.
//   Tier 6: Spring Sorrow charges 2 → 3. Hitting an enemy with Combo from
//           you reduces Spring Sorrow's cooldown by 5s and grants 25
//           Blossoms. Once per skill cast.
//
// Placeholder (validated: false). The Combo debuff and the multi-hit gating
// are gluing inner-way reads against the silkbindJade class's debuffs and
// skills. The tier table only carries values that scale with the panel.
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"

export const BLOSSOM_BARRAGE_COMBO_BOOST_BASE = 0.1
export const BLOSSOM_BARRAGE_COMBO_BOOST_T1 = 0.2
export const BLOSSOM_BARRAGE_COMBO_DURATION_BASE_SEC = 10
export const BLOSSOM_BARRAGE_COMBO_DURATION_T3_SEC = 15
export const BLOSSOM_BARRAGE_CAST_SPEED_T3 = 0.3
export const BLOSSOM_BARRAGE_SPRING_AWAY_DAMAGE_T4 = 0.1
export const BLOSSOM_BARRAGE_SPRING_AWAY_TARGETS_T4 = 5
export const BLOSSOM_BARRAGE_SPRING_AWAY_TARGETS_BASE = 3
export const BLOSSOM_BARRAGE_CRIT_DAMAGE_T5 = 0.044
export const BLOSSOM_BARRAGE_BLOSSOMS_T6 = 25
export const BLOSSOM_BARRAGE_COOLDOWN_REDUCTION_T6_SEC = 5
export const BLOSSOM_BARRAGE_SPRING_SORROW_CHARGES_BASE = 2
export const BLOSSOM_BARRAGE_SPRING_SORROW_CHARGES_T6 = 3

export const blossomBarrage = defineInnerWay({
  id: INNER_WAY_ID.blossomBarrage,
  name: "Blossom Barrage",
  legacyNames: [],
  selectableTiers: [6, 5, 4, 3, 2, 1],
  // Tier 1: Combo damage-taken bonus 10% → 20%.
  // Tier 2: crit rate based on Solo Mode Level (1.7 per level baseline).
  // Tier 3: cast speed +30% on Spring Sorrow; Combo duration 10s → 15s.
  // Tier 4: Spring Away damage +10% on Combo'd targets; targets 3 → 5.
  // Tier 5: crit damage +4.4%.
  // Tier 6: Spring Sorrow charges 2 → 3; on Combo'd hit, -5s CD + 25 Blossoms.
  tiers: {
    1: { nodes: [] },
    2: { panelStats: { critRate: 0.014 } },
    3: {
      nodes: [INNER_WAY_NODE.blossomBarrageLongerCombo],
    },
    4: { nodes: [INNER_WAY_NODE.blossomBarrageSpringAwayBoost] },
    5: { panelStats: { critDamageBoost: BLOSSOM_BARRAGE_CRIT_DAMAGE_T5 } },
    6: { nodes: [INNER_WAY_NODE.blossomBarrageSpringSorrowTripleCharge] },
  },
})
