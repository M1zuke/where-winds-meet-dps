import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import { BUFF } from "../buffs/ids"

export const deflectCancelPrepull = defineSkill({
  id: SKILL.deflectCancelPrepull,
  classId: "universal",
  name: "Deflect Cancel Prepull",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.deflectCancelPrepull,
  castFrames: 0,
  triggerable: true,
  // In-game values as of 2026-09-28: no approach, confirmed — a large reach
  // keeps this stationary, non-damaging cast from capping the live distance.
  reachMeters: 100,
  approach: "stationary",
  triggersBuffs: [BUFF.cleftpeakDeflectGrant],
  hits: [hit(0, { frame: 0, physMultiplier: 0, attributeMultiplier: 0, physFixed: 0, attributeFixed: 0 })],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
