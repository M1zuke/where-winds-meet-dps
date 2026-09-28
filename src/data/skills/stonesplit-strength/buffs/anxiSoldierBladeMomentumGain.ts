import { meterDelta } from "../../../../definitions/skills/triggers"
import { bladeMomentumMeter } from "../../../classes/stonesplit-strength/bladeMomentumMeter"

// In-game values as of 2026-09-25: +2.5 Blade Momentum per Anxi Soldier hit,
// at most 4 times per second — the Phalanxbane stage-5 talent this meter's own
// 150 capacity already assumes every buildable profile carries.
export const ANXI_SOLDIER_BLADE_MOMENTUM_GAIN = meterDelta({
  target: bladeMomentumMeter.id,
  stacks: 2.5,
  cooldownFrames: 15,
  cooldownGroup: "anxiSoldierBladeMomentumGain",
})
