import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, PROP, ROLE, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const anxisoldierheng = defineSkill({
  id: SKILL.anxisoldierheng,
  classId: "stonesplitStrength",
  name: "AnxiSoldierHeng",
  tags: [WEAPON.hengBlade, PROP.shatteredRidgeBoost, ROLE.anxiSoldier],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.anxiSoldierHeng,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.35,
      attributeMultiplier: 0.525,
      physFixed: 0,
      attributeFixed: 0,
    }),
    hit(1, {
      frame: 0,
      physMultiplier: 0.35,
      attributeMultiplier: 0.525,
      physFixed: 0,
      attributeFixed: 0,
    }),
    hit(2, {
      frame: 0,
      physMultiplier: 0.35,
      attributeMultiplier: 0.525,
      physFixed: 0,
      attributeFixed: 0,
    }),
    hit(3, {
      frame: 0,
      physMultiplier: 0.35,
      attributeMultiplier: 0.525,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
