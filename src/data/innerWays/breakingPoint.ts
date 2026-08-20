import { defineInnerWay, type InnerWayDef } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { disintegrationBuffDef } from "./breakingPointBuffs"

// Annotated, not left to inference: `disintegrationBuffDef()`'s tier getter
// reads this binding, so without an explicit type here TypeScript tries to
// infer this declaration's type FROM that getter's return type — circular.
export const breakingPoint: InnerWayDef = defineInnerWay({
  id: INNER_WAY_ID.breakingPoint,
  name: "Breaking Point",
  selectableTiers: [6, 5],
  buffParam: PARAM.breakingPoint,
  tiers: {
    2: { panelStats: { precision: 0.069 } },
    5: { panelStats: { directCritRate: 0.041 } },
    6: { nodes: [INNER_WAY_NODE.breakingPointPerfectDodgeStacks] },
  },
  buffDefs: [disintegrationBuffDef()],
})
