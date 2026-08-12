import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { CAST, ROLE } from "../../skills/ids"
import { stat } from "../../../engine/effects/effect"
import { matchesScope } from "../../../engine/scope"

const AFFECTS = [ROLE.phalanxCharged, ROLE.anxiSoldierMoDown, ROLE.anxiSoldierMoJump]

export const mountainSplitter = defineClassBuff({
  id: BUFF.mountainSplitter,
  name: "Mountain Splitter",
  requires: { param: PARAM.steadfastDevotion, minTier: 3 },
  triggeredBy: [CAST.anxiSoldierMoDown, CAST.anxiSoldierMoJump, CAST.anxiSoldierMoSweep],
  triggersFromGeneratedSkills: true,
  requiresActiveBuffOnTrigger: BUFF.innerPassion,
  affects: AFFECTS,
  duration: 10,
  cooldown: 15,
  conditionalFinalCrit: { threshold: 0.75, bonusBelowThreshold: 0.15 },
  summary: "critDamageBoost +10%, and a guaranteed crit at 75% or higher",
  effects: (ctx) => {
    if (ctx.event.kind !== "damage" || !matchesScope(ctx.event.tags, { affects: AFFECTS }))
      return []
    return [stat("critDamageBoost", 0.1)]
  },
})
