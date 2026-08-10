// River Flow and Spear Special Cooldown carry no stat effects on purpose —
// they are gates consumed by the timeline (HitVariant swaps, trigger
// conditions), not `{statKey, amount}` effects.
import type { Buff } from "../../engine/buff"
import { registerBuiltinBuffs } from "../../engine/builtinBuffs"
import { registerPoisonExtension } from "../../engine/mechanics/bitterSeason"
import { CROSSWIND_MAX_CHARGES } from "../skills/buffs/crosswindSpirit"
import {
  STATUS,
  ZENITH_MAX_EXTENDED_DURATION_FRAMES,
  ZENITH_SMOLDER_EXTEND_FRAMES,
} from "../skills/bellstrike-umbra/ids"

export { ZENITH_SMOLDER_EXTEND_FRAMES, ZENITH_MAX_EXTENDED_DURATION_FRAMES }

export const RIVER_FLOW_DURATION_FRAMES = 900
export const SPEAR_SPECIAL_COOLDOWN_FRAMES = 690

export const RIVER_FLOW_BUFF_ID = STATUS.riverFlow
export const SPEAR_SPECIAL_COOLDOWN_BUFF_ID = STATUS.spearSpecialCooldown
export const ZENITH_BAR_BUFF_ID = STATUS.zenithBar
export const ZENITH_DETONATION_BUFF_ID = STATUS.zenithDetonation
export const ZENITH_DETONATION_FRAMES = 1

export const BELLSTRIKE_UMBRA_GATES: Buff[] = [
  {
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
  },
  {
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
  },
  {
    id: ZENITH_BAR_BUFF_ID,
    classId: "bellstrikeUmbra",
    name: "Zenith Bar",
    scope: "player",
    activation: "permanent",
    durationFrames: 0,
    effects: [],
    maxStacks: CROSSWIND_MAX_CHARGES,
    stackScaling: "flat",
    createdAt: "2026-07-31T00:00:00.000Z",
    updatedAt: "2026-07-31T00:00:00.000Z",
  },
  {
    id: ZENITH_DETONATION_BUFF_ID,
    classId: "bellstrikeUmbra",
    name: "Zenith Detonation",
    scope: "player",
    activation: "triggered",
    durationFrames: ZENITH_DETONATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-07-30T00:00:00.000Z",
  },
]

registerBuiltinBuffs("bellstrikeUmbra", BELLSTRIKE_UMBRA_GATES)

// Sword Horizon's Zenith detonation extends an active Bitter Season poison.
registerPoisonExtension(ZENITH_DETONATION_BUFF_ID, ZENITH_MAX_EXTENDED_DURATION_FRAMES / 60)
