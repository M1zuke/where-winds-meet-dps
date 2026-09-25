import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"

export const deflect = defineSkill({
  id: SKILL.deflect,
  classId: "stonesplitStrength",
  name: "Deflect",
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Stonesplit",
  castTag: CAST.deflect,
  triggersBuffs: [BUFF.cleftpeakDeflectGrant],
  castFrames: 25,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({ target: BUFF.snowbreakSpringAvailable, requiresParam: PARAM.frostCladNight }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
