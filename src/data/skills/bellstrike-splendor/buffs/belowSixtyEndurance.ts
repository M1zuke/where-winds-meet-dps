import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// The engine tracks no endurance, so the toggle means "assume the window is
// open for the whole rotation" rather than following a live value. It is off
// by default because the reference rotation only holds it for a fraction of
// its rows, and unlike the other endurance buffs it reaches everything — the
// workbook attaches it to the mystics and Daunting Strike as readily as to the
// sword energy attacks.
export const belowSixtyEndurance = defineClassBuff({
  id: BUFF.belowSixtyEndurance,
  name: "Below 60% Endurance",
  requires: { param: PARAM.lowEndurance },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  effects: [stat("affinityDamageBoost", 0.18)],
})
