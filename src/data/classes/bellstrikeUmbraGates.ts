// River Flow and Spear Special Cooldown carry no stat effects on purpose —
// they are gates consumed by the timeline (HitVariant swaps, trigger
// conditions), not `{statKey, amount}` effects.
import type { Buff } from "../../engine/buff"
import { defineGateBuff } from "../../definitions/skills/skillDef"
import { STATUS } from "../skills/bellstrike-umbra/ids"

export const RIVER_FLOW_DURATION_FRAMES = 900
export const SPEAR_SPECIAL_COOLDOWN_FRAMES = 690

export const RIVER_FLOW_BUFF_ID = STATUS.riverFlow
export const SPEAR_SPECIAL_COOLDOWN_BUFF_ID = STATUS.spearSpecialCooldown

export const BELLSTRIKE_UMBRA_GATES: Buff[] = [
  defineGateBuff({
    id: RIVER_FLOW_BUFF_ID,
    classId: "bellstrikeUmbra",
    name: "River Flow",
    scope: "player",
    activation: "triggered",
    durationFrames: RIVER_FLOW_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-07-30T00:00:00.000Z",
  }),
  defineGateBuff({
    id: SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
    classId: "bellstrikeUmbra",
    name: "Spear Special Cooldown",
    scope: "player",
    activation: "triggered",
    durationFrames: SPEAR_SPECIAL_COOLDOWN_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-07-30T00:00:00.000Z",
  }),
]
