import { meterDelta } from "../../../../definitions/skills/triggers"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-25: +8 Endurance at the skill's own end,
// cancelled forms included.
export const CRISSCROSS_ENDURANCE_GAIN = meterDelta({
  target: enduranceMeter.id,
  stacks: 8,
  appliesOnCastEnd: true,
})
