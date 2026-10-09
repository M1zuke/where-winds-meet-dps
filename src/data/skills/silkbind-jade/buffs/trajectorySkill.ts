import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { artBonus } from "../../../../engine/effects/effect"

// The talent's boosted penetration needs a controlled or airborne target,
// which the training stake never is — this always resolves to the base 5.
// In-game values as of 2026-09-24.
const PENETRATION = 5

export const trajectorySkill = defineClassBuff({
  id: BUFF.trajectorySkill,
  name: "Trajectory Skill",
  alwaysActive: true,
  duration: 9999,
  summary: "ignores 5 Physical Resistance",
  effects: () => [artBonus("extraPhysPenetration", PENETRATION)],
})
