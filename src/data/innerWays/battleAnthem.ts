import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { battleAnthemEnduranceBoost } from "./battleAnthemBuffs"

// The in-game panel reads 3.3% affinity rate at solo mode level 14 (2026-05),
// scaled here to the level the shipped inner ways store. The affinity damage
// bonus is stated flat in-game, so it is carried unscaled.
export const battleAnthem = defineInnerWay({
  id: INNER_WAY_ID.battleAnthem,
  name: "Battle Anthem",
  selectableTiers: [6, 5, 3],
  buffParam: PARAM.battleAnthem,
  panelStats: {
    affinityRate: 0.0385,
    affinityDamageBoost: 0.052,
  },
  tiers: {
    6: { nodes: [INNER_WAY_NODE.battleAnthemEnduranceBonus] },
  },
  buffDefs: [battleAnthemEnduranceBoost],
})
