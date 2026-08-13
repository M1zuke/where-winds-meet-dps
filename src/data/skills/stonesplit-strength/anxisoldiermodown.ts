import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const anxisoldiermodown = defineSkill({
  id: SKILL.anxisoldiermodown,
  classId: "stonesplitStrength",
  name: "AnxiSoldierMoDown",
  tags: [
    WEAPON.moBlade,
    PROP.shatteredRidgeBoost,
    ATTUNE.phalanxbaneCharged,
    ROLE.anxiSoldier,
    ROLE.anxiSoldierMoDown,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.anxiSoldierMoDown,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.5,
      attributeMultiplier: 0.75,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        castSkill({ id: "tg-anxisoldiermodown-cast", target: SKILL.anxisoldiermojump, stacks: 0 }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
