import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import { BUFF } from "../buffs/ids"

// The guard that ends a cancelled recovery, 12 frames for this class (project
// owner, 2026-09-06); the guard animation itself is unmeasured.
export const deflectCancel = defineSkill({
  id: SKILL.deflectCancel,
  classId: "silkbindJade",
  name: "Deflect Cancel",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.deflectCancel,
  castFrames: 12,
  triggerable: true,
  // In-game values as of 2026-09-28: no approach, confirmed — a large reach
  // keeps this stationary, non-damaging cast from capping the live distance.
  reachMeters: 100,
  approach: "stationary",
  triggersBuffs: [BUFF.cleftpeakDeflectGrant],
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-09-28T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
