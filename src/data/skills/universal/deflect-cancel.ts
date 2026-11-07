import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import { BUFF } from "../buffs/ids"

export const deflectCancel = defineSkill({
  id: SKILL.deflectCancel,
  classId: "universal",
  name: "Deflect Cancel",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.deflectCancel,
  // Cast length to the earliest next input on every weapon's Deflection
  // animation: in-game animation, 2026-09-24.
  castFrames: 18,
  triggerable: true,
  // In-game values as of 2026-09-28: no approach, confirmed — a large reach
  // keeps this stationary, non-damaging cast from capping the live distance.
  reachMeters: 100,
  approach: "stationary",
  triggersBuffs: [BUFF.cleftpeakDeflectGrant],
  hits: [hit(0, { frame: 0, physMultiplier: 0, attributeMultiplier: 0, physFixed: 0, attributeFixed: 0 })],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
