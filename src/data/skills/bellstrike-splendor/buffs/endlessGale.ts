import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// The Martial Talent's Affinity DMG Bonus applies while Endless Gale is up.
// The direct-affinity half is Mountain's Might's, and lives on that inner way
// — putting it here too would apply it twice.
//
// That inner way also "extends the duration of Endless Gale to 10s" (in-game
// English text, 2026-08-15), so the window is 5s on its own and 10s with it.
// In-game values as of 2026-09-24: the Q also opens a second, fixed-length
// copy at the cast's own start (`endlessGaleAtStart`) — a broken Q still
// carries both.
export const endlessGale = defineClassBuff({
  id: BUFF.endlessGale,
  name: "Endless Gale",
  affectsAll: true,
  reachesDotTicks: false,
  duration: (ctx) => (ctx.build.param(PARAM.mountainsMight) ? 10 : 5),
  buffAppliesOnCastEnd: true,
  summary: "affinityDmg +18%",
  effects: [stat("affinityDamageBoost", 0.18)],
})

// The +18% does not stack with itself.
export const endlessGaleAtStart = defineClassBuff({
  id: BUFF.endlessGaleAtStart,
  name: "Endless Gale (from the cast's start)",
  affectsAll: true,
  reachesDotTicks: false,
  duration: 5,
  summary: "affinityDmg +18%, except while the cast-end copy already grants it",
  effects: (ctx) =>
    ctx.status.isActive(BUFF.endlessGale) ? [] : [stat("affinityDamageBoost", 0.18)],
})
