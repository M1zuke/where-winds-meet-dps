import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { bingePointDodgeGrant } from "./perfect-dodge"

export const perfectDodgeFull = defineSkill({
  id: SKILL.perfectDodgeFull,
  classId: "bamboocutDraught",
  name: "Perfect Dodge[Full]",
  tags: [WEAPON.none],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Bamboocut",
  castTag: CAST.perfectDodgeFull,
  triggersBuffs: [BUFF.mirageBonus, BUFF.disintegration],
  castFrames: 50,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [bingePointDodgeGrant],
    }),
  ],
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
})
