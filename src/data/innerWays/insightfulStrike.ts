import { declareMechanic, MECHANIC_ORDER } from "../../engine/mechanics"
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { BUFF } from "../skills/buffs/ids"
import { concentrationAvailable, insightfulStrikeMechanic } from "./insightfulStrikeMechanic"
import { concentrationBuffDef } from "./insightfulStrikeConcentration"

// VERIFIED as the right inner way for `concentration`, but deliberately left
// without a `buffParam` after an overlap audit: the only def gated by it
// (`concentration`) is composed entirely of `affinityDmg` / `directAffinity` /
// `dotDamage` + `enhancedDotDamage` stat modifiers — every one of those
// channels (`affinityDamageBoost`, `directAffinityRate`, `sustainDamageBoost`)
// is ALREADY baked into the panel's own Insightful Strike model
// (`insightfulStrikeMechanic.ts`'s `EFFECTS`, fed through `buildContext`'s
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
  mechanics: [declareMechanic(insightfulStrikeMechanic(), MECHANIC_ORDER.concentration)],
  displayGates: [{ defId: BUFF.concentration, predicate: concentrationAvailable }],
  buffDefs: [concentrationBuffDef()],
})
