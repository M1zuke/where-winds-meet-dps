import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { stat } from "../../../../engine/effects/effect"
import { BUFF, PARAM } from "../../buffs/ids"

// In-game values as of 2026-10-12: from Phantom Rally rank 4 both resonance
// hits deal 20% more damage.
export const phantomRallyResonanceBoost = defineClassBuff({
  id: BUFF.phantomRallyResonanceBoost,
  name: "Phantom Rally (Resonance)",
  requires: { param: PARAM.phantomRally, minTier: 4 },
  alwaysActive: true,
  duration: 9999,
  effects: [stat("allDamageBoost", 0.2)],
})
