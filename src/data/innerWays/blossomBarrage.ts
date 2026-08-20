import { defineInnerWay, type InnerWayDef } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { comboBuffDef, comboUmbLightBonusBuffDef } from "./blossomBarrageBuffs"

// Client localization ladder (2026-08-15): base +10% Combo damage taken for
// 10s; an unnumbered rung raising it to +20% for the same 10s; a further rung
// extends the window to 15s and adds Spring Sorrow's +30% cast speed; Tier 4
// (`comboUmbLightBonus.json`'s own `minTier`) adds Spring Away's +10% bonus
// against a Combo'd target and raises its target cap from 3 to 5. Only the
// Tier-4 rung carries a sourced tier number, so `combo`'s existing 0.2/15s
// values ship as the unconditional base rather than inventing where the
// 10%->20% and 10s->15s steps unlock.
export const blossomBarrage: InnerWayDef = defineInnerWay({
  id: INNER_WAY_ID.blossomBarrage,
  name: "Blossom Barrage",
  selectableTiers: [6, 5, 4, 2],
  buffParam: PARAM.blossomBarrage,
  tiers: {
    2: { panelStats: { critRate: 0.086 } },
    4: { nodes: [INNER_WAY_NODE.blossomBarrageSpringAwayBonus] },
    5: { panelStats: { directCritRate: 0.046 } },
  },
  buffDefs: [comboBuffDef(), comboUmbLightBonusBuffDef()],
})
