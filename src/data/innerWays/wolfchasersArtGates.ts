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

// Sincerity's four-tier ladder (Water Drop / Spring Surge / River Flow /
// Empowered River Flow) is layered rather than exclusive: each tier above the
// floor is authored as the ADDITIONAL amount on top of the tier below it, so
// they can be granted together and still sum to the tier actually reached
// (10 / 15 / 20 / 25 %), and a condition checking "at least River Flow" via
// `BUFF.potentRiverFlow` stays true once Empowered is reached too.
export const WATER_DROP_BUFF_ID = "buff-bellstrikeUmbra-water-drop"
export const SPRING_SURGE_BUFF_ID = "buff-bellstrikeUmbra-spring-surge"
export const EMPOWERED_RIVER_FLOW_BUFF_ID = "buff-bellstrikeUmbra-empowered-river-flow"

// In-game values as of 2026-09-24: each Sober Sorrow hit on a Bleeding target
// adds a second combo with a 60/70/80/90/100 % chance at 1–5 stacks; each
// tier is granted where it is the more likely outcome.
export const RIVER_FLOW_MIN_BLEEDING_STACKS = 1
export const EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST = 1
export const EMPOWERED_MIN_BLEEDING_STACKS_FIVE_HIT_CANCEL = 4

export const RIVER_FLOW_DURATION_FRAMES = 900
export const RIVER_FLOW_BASE_DURATION_FRAMES = 720
export const RIVER_FLOW_WOLFCHASERS_ART_EXTEND_FRAMES =
  RIVER_FLOW_DURATION_FRAMES - RIVER_FLOW_BASE_DURATION_FRAMES
export const SPEAR_SPECIAL_COOLDOWN_FRAMES = 720

export const WOLFCHASERS_ART_GATES: readonly InnerWayGateBuff[] = [
  defineInnerWayGateBuff({
    id: WATER_DROP_BUFF_ID,
    name: "Water Drop",
    scope: "player",
    activation: "triggered",
    durationFrames: RIVER_FLOW_BASE_DURATION_FRAMES,
    effects: [{ statKey: "allDamageBoost", amount: 0.1 }],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-09-24T00:00:00.000Z",
    updatedAt: "2026-09-25T00:00:00.000Z",
  }),
  defineInnerWayGateBuff({
    id: SPRING_SURGE_BUFF_ID,
    name: "Spring Surge",
    scope: "player",
    activation: "triggered",
    durationFrames: RIVER_FLOW_BASE_DURATION_FRAMES,
    effects: [{ statKey: "allDamageBoost", amount: 0.05 }],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-09-24T00:00:00.000Z",
    updatedAt: "2026-09-25T00:00:00.000Z",
  }),
  defineInnerWayGateBuff({
    id: BUFF.potentRiverFlow,
    name: "River Flow",
    scope: "player",
    activation: "triggered",
    durationFrames: RIVER_FLOW_DURATION_FRAMES,
    effects: [{ statKey: "allDamageBoost", amount: 0.05 }],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.wolfchasersArt,
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-09-25T00:00:00.000Z",
  }),
  defineInnerWayGateBuff({
    id: EMPOWERED_RIVER_FLOW_BUFF_ID,
    name: "Empowered River Flow",
    scope: "player",
    activation: "triggered",
    durationFrames: RIVER_FLOW_DURATION_FRAMES,
    effects: [{ statKey: "allDamageBoost", amount: 0.05 }],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.wolfchasersArt,
    requiresMinTier: 4,
    createdAt: "2026-09-24T00:00:00.000Z",
    updatedAt: "2026-09-24T00:00:00.000Z",
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
