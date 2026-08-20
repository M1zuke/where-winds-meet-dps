import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { stat } from "../../../engine/effects/effect"

export const mountainSplitter = defineBuff({
  id: BUFF.mountainSplitter,
  name: "Mountain Splitter",
  requires: { param: PARAM.steadfastDevotion, minTier: 3 },
  triggersFromGeneratedSkills: true,
  requiresActiveBuffOnTrigger: BUFF.innerPassion,
  duration: 10,
  cooldown: 15,
  conditionalFinalCrit: { threshold: 0.75, bonusBelowThreshold: 0.15 },
  summary: "critDamageBoost +10%, and a guaranteed crit at 75% or higher",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("critDamageBoost", 0.1)] : []),
})
