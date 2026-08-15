import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// The Martial Talent's Affinity DMG Bonus applies while Endless Gale is up.
// The direct-affinity half is Mountain's Might's, and lives on that inner way
// — putting it here too would apply it twice.
//
// That inner way also "extends the duration of Endless Gale to 10s" (client
// localization, 2026-08-15), so the window is 8s on its own and 10s with it.
export const endlessGale = defineClassBuff({
  id: BUFF.endlessGale,
  name: "Endless Gale",
  affectsAll: true,
  duration: (ctx) => (ctx.build.param(PARAM.mountainsMight) ? 10 : 8),
  buffAppliesOnCastEnd: true,
  summary: "affinityDmg +18%",
  effects: [stat("affinityDamageBoost", 0.18)],
})
