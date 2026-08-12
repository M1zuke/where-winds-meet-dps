import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { CAST, ROLE } from "../../skills/ids"
import { stat } from "../../../engine/effects/effect"
import { matchesScope } from "../../../engine/scope"

// The skills that lay the stacks also take the larger per-stack cut; everything
// else the character does takes the smaller one.
const MATCHED = [
  ROLE.anxiSoldier,
  ROLE.snowpartingQStab,
  ROLE.snowpartingVC,
  ROLE.phalanxCharged,
  ROLE.phalanxQ,
]

export const throatPierced = defineClassBuff({
  id: BUFF.throatPierced,
  name: "Throat-Pierced",
  requires: { param: PARAM.throatPierced },
  triggeredBy: [
    CAST.anxiSoldierHeng,
    CAST.anxiSoldierMoDown,
    CAST.anxiSoldierMoJump,
    CAST.anxiSoldierMoSweep,
    CAST.snowpartingQStab,
    CAST.snowpartingVC,
    CAST.snowpartingVCPrepull,
    CAST.phalanxChargedS3,
    CAST.phalanxChargedS3InnerPassion,
    CAST.phalanxQ,
  ],
  triggersFromGeneratedSkills: true,
  affects: null,
  duration: 15,
  maxStacks: 5,
  stacksPerHit: true,
  summary: "per stack: physPen +3 / critDmg +3% on the applying skills, +2 / +2% elsewhere",
  effects: (ctx) => {
    if (ctx.event.kind !== "damage") return []
    const matched = matchesScope(ctx.event.tags, { affects: MATCHED })
    const stacks = ctx.self.stacks
    return [
      stat("phys.penetration", (matched ? 0.03 : 0.02) * stacks),
      stat("critDamageBoost", (matched ? 0.03 : 0.02) * stacks),
    ]
  },
})
