import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { springThunder, thunderousBloomBuffDef } from "./thunderousBloomBuffs"

export const thunderousBloom = defineInnerWay({
  id: INNER_WAY_ID.thunderousBloom,
  name: "Thunderous Bloom",
  selectableTiers: [6, 5],
  confirmedBreakthrough: 17,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.weaponAttackFourStar },
    5: { panelStats: { physBoost: 0.025 } },
  },
  buffParam: PARAM.thunderousBloom,
  // Pool before boost: at one damage hit the restore lands before the consume
  // spends, so a qualifying hit on the last stack keeps the pool alive.
  buffDefs: [springThunder, thunderousBloomBuffDef],
})
