import { meterDelta } from "../../../../definitions/skills/triggers"
import { PARAM } from "../../buffs/ids"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-28: +10 Endurance on a crit or affinity hit of
// a charged skill, tier 3 and up, at most once per 12 s. The 12 s cooldown
// only starts on a successful crit/affinity hit, so with several charged hits
// landing inside that window the modal outcome — every validated build's own
// crit-or-affinity chance exceeds 50% — is that it always grants the full 10,
// not a chance-scaled fraction of it.
export const BATTLE_ANTHEM_ENDURANCE_GAIN = meterDelta({
  target: enduranceMeter.id,
  stacks: 10,
  requiresParam: PARAM.battleAnthem,
  requiresMinTier: 3,
  cooldownFrames: 720,
  cooldownGroup: "battleAnthemEnduranceGain",
})
