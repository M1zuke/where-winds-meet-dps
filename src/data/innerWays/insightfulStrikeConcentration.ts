// Concentration's runtime model is `insightfulStrikeMechanic.ts`'s
// probability-weighted 4-hit ramp; this def is only its Skill Editor
// projection, sharing the id so the two are one entity rather than a duplicate
// that merely agrees. It must therefore stay off `seedAtStart`, `alwaysActive`
// and `refreshOnAnyCast`, and declare no trigger — each of those makes
// `BuffEngine` apply the same bonuses a second time, on top of the mechanic's.
import { defineClassBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"

export const concentrationBuffDef = defineClassBuff({
  id: BUFF.concentration,
  name: "Concentration",
  requires: { param: PARAM.insightfulStrike },
  triggeredBy: [],
  duration: 10,
  summary: "affinityDmg +10%, directAffinity +3%",
  effects: [stat("affinityDamageBoost", 0.1), stat("directAffinityRate", 0.03)],
})
