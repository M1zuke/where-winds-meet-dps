import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const anxisoldiermojump = defineSkill({
  id: SKILL.anxisoldiermojump,
  classId: "stonesplitStrength",
  name: "AnxiSoldierMoJump",
  tags: [
    WEAPON.moBlade,
    PROP.shatteredRidgeBoost,
    ATTUNE.phalanxbaneCharged,
    ROLE.anxiSoldier,
    ROLE.anxiSoldierMoJump,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.anxiSoldierMoJump,
  receives: [BUFF.mountainSplitter, BUFF.shatteredRidgeDeflect],
  triggersBuffs: [BUFF.throatPierced, BUFF.mountainSplitter],
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.9,
      attributeMultiplier: 1.35,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
