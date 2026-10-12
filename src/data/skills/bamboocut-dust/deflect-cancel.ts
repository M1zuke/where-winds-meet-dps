import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { BUFF } from "../buffs/ids"
import { CAST } from "../ids"
import { SKILL } from "./ids"

// The guard that ends a cancelled recovery: 12 frames, the umbrella
// deflection's input-accepted frame (in-game values as of 2026-10-12; the rope
// dart deflection reads the same).
export const deflectCancel = defineSkill({
  id: SKILL.deflectCancel,
  classId: "bamboocutDust",
  name: "Deflect Cancel",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustDeflectCancel,
  castFrames: 12,
  triggerable: true,
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
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
