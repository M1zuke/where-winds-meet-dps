import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// The Martial Talent's Affinity DMG Bonus applies while Endless Gale is up.
// The direct-affinity half is Mountain's Might's, and lives on that inner way
// — putting it here too would apply it twice.
export const endlessGale = defineClassBuff({
  id: BUFF.endlessGale,
  name: "Endless Gale",
  affectsAll: true,
  duration: 8,
  buffAppliesOnCastEnd: true,
  effects: [stat("affinityDamageBoost", 0.18)],
})
