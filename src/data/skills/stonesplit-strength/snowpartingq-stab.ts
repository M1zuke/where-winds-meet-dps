import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"

export const snowpartingqStab = defineSkill({
  id: SKILL.snowpartingqStab,
  classId: "stonesplitStrength",
  name: "SnowpartingQ-Stab",
  tags: [WEAPON.hengBlade, ATTUNE.snowpartingQ, PROP.shatteredRidgeBoost, ROLE.snowpartingQStab],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingQStab,
  castFrames: 113,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 2.1324,
      attributeMultiplier: 3.1986,
      physFixed: 590,
      attributeFixed: 322,
      triggers: [
        castSkill({ id: "tg-snowpartingq-stab-cast", target: SKILL.anxisoldierheng, stacks: 0 }),
        applyBuff({
          id: "tg-snowpartingq-stab-dread-extension",
          target: STATUS.dread,
          stacks: 0,
          extendFrames: 360,
          extendOnly: true,
        }),
        applyBuff({ id: "tg-snowpartingq-stab-fearful-blade", target: STATUS.fearfulBlade }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
