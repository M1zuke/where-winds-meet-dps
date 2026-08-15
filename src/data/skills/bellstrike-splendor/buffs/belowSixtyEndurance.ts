import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// The endurance half of the Nameless Spear talent `endlessGale` carries the
// other half of: "When you have Endless Gale or Endurance is below 60%,
// increases Affinity DMG based on Affinity Rate, up to an 18% increase at 30%
// Affinity Rate" (in-game talent panel, 2026-08-15). One bonus behind two
// conditions, so it yields nothing while the Endless Gale window is already
// paying it — both at once would double it.
//
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
  summary: "affinityDmg +18%, except while Endless Gale already grants it",
  effects: (ctx) =>
    ctx.status.isActive(BUFF.endlessGale) ? [] : [stat("affinityDamageBoost", 0.18)],
})
