// The first gate here is the projection of River Flow whose magnitude
// `riverFlowBuffDef` carries under this same id. Both live apart from that
// module because `wolfchasersArtBuffs.ts` and `wolfchasersArt.ts` import each
// other, and a `const` read from `wolfchasersArt.ts`'s own body would be in TDZ.
import {
  defineInnerWayGateBuff,
  type InnerWayGateBuff,
} from "../../definitions/innerWays/innerWayDef"
import { BUFF, PARAM } from "../skills/buffs/ids"

// Persisted inside saved custom skills (trigger conditions) and saved rotations
// (`permanentBuffIds`) — the `bellstrikeUmbra` substring is a frozen historical
// artifact from when the class declared this gate, and must not be "corrected"
// now that the inner way owns it.
export const SPEAR_SPECIAL_COOLDOWN_BUFF_ID = "buff-bellstrikeUmbra-spear-special-cooldown"

export const RIVER_FLOW_DURATION_FRAMES = 900
export const SPEAR_SPECIAL_COOLDOWN_FRAMES = 690

export const WOLFCHASERS_ART_GATES: readonly InnerWayGateBuff[] = [
  defineInnerWayGateBuff({
    id: BUFF.potentRiverFlow,
    name: "River Flow",
    scope: "player",
    activation: "triggered",
    durationFrames: RIVER_FLOW_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.wolfchasersArt,
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-07-30T00:00:00.000Z",
  }),
  defineInnerWayGateBuff({
    id: SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
    name: "Spear Special Cooldown",
    scope: "player",
    activation: "triggered",
    durationFrames: SPEAR_SPECIAL_COOLDOWN_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.wolfchasersArt,
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-07-30T00:00:00.000Z",
  }),
]
