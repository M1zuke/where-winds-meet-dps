import { defineInnerWay, type InnerWayDef } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { potentRiverFlowBuffDef, soulShakenBuffDef, wineGuBuffDef } from "./wolfchasersArtBuffs"

// Annotated, not left to inference: `soulShakenBuffDef()`'s `minTier` getter
// reads this binding, so without an explicit type here TypeScript tries to
// infer this declaration's type FROM that getter's return type — circular.
export const wolfchasersArt: InnerWayDef = defineInnerWay({
  id: INNER_WAY_ID.wolfchasersArt,
  name: "Wolfchaser's Art",
  selectableTiers: [6, 5],
  buffParam: PARAM.wolfchasersArt,
  panelStats: {
    affinityRate: 0.039,
    affinityDamageBoost: 0.052,
  },
  tiers: {
    6: { nodes: [INNER_WAY_NODE.soulShaken] },
  },
  // Wine Gu's `allDamageBoost` sums after Potent River Flow's and Soul
  // Shaken's after both, exactly as before the three moved here together.
  buffDefs: [potentRiverFlowBuffDef(), wineGuBuffDef(), soulShakenBuffDef()],
})
