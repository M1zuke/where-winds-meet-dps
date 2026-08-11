import { defineInnerWay } from "./define"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"

// VERIFIED as the right inner way for `concentration`, but deliberately left
// without a `buffParam` after an overlap audit: the only def gated by it
// (`concentration`) is composed entirely of `affinityDmg` / `directAffinity` /
// `dotDamage` + `enhancedDotDamage` stat modifiers — every one of those
// channels (`affinityDamageBoost`, `directAffinityRate`, `sustainDamageBoost`)
// is ALREADY baked into the panel's own Insightful Strike model
// (`bellstrikeUmbraConcentration.ts`'s `EFFECTS`, fed through `buildContext`'s
// `dotDamageBoost` — see `insightfulStrike.test.ts`). Mapping it would
// double-count those bonuses on top of the panel model with zero new content
// from the site buff. If `concentration` is ever extended with a genuinely
// new (non-overlapping) effect, re-derive this decision before adding one.
export const insightfulStrike = defineInnerWay({
  id: INNER_WAY_ID.insightfulStrike,
  name: "Insightful Strike",
  selectableTiers: [6, 5],
  panelStats: {
    "phys.min": 22.3,
    "phys.max": 44.7,
    "phys.penetration": 0.051,
  },
  scalars: {
    dotDamageBoost: 0.1,
    allDamageBonus: 0.015,
  },
  tiers: {
    6: {
      nodes: [INNER_WAY_NODE.concentrationDotMultiplier, INNER_WAY_NODE.concentrationSustainPair],
    },
  },
})
