import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, PROP, ROLE, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const anxisoldiermosweep = defineSkill({
  id: SKILL.anxisoldiermosweep,
  classId: "stonesplitStrength",
  name: "AnxiSoldierMoSweep",
  tags: [WEAPON.moBlade, PROP.shatteredRidgeBoost, ROLE.anxiSoldier],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.anxiSoldierMoSweep,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.5,
      attributeMultiplier: 0.75,
      physFixed: 0,
      attributeFixed: 0,
    }),
    hit(1, {
      frame: 0,
      physMultiplier: 0.5,
      attributeMultiplier: 0.75,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
