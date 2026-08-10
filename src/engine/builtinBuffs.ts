// The built-in `Buff` pools, per class. A class's gate buffs are its own data,
// so they live under `src/data/classes/`; this is the engine-side lookup.
import type { Buff } from "./buff"
import { BELLSTRIKE_UMBRA_GATES } from "../data/classes/bellstrikeUmbraGates"

// Ids and durations the timeline and the Bitter Season mechanic reference by
// name. Re-exported here so nothing outside the class folder imports it.
export {
  RIVER_FLOW_BUFF_ID,
  RIVER_FLOW_DURATION_FRAMES,
  SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
  SPEAR_SPECIAL_COOLDOWN_FRAMES,
  ZENITH_BAR_BUFF_ID,
  ZENITH_DETONATION_BUFF_ID,
  ZENITH_DETONATION_FRAMES,
  ZENITH_SMOLDER_EXTEND_FRAMES,
  ZENITH_MAX_EXTENDED_DURATION_FRAMES,
} from "../data/classes/bellstrikeUmbraGates"

const BUILTIN_BUFFS: Record<string, Buff[]> = {
  bellstrikeUmbra: BELLSTRIKE_UMBRA_GATES,
}

export function builtinBuffsForClass(classId: string): Buff[] {
  return BUILTIN_BUFFS[classId] ?? []
}
