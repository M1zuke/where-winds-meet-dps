import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const snowpartingvc = defineSkill({
  id: SKILL.snowpartingvc,
  classId: "stonesplitStrength",
  name: "SnowpartingVC",
  tags: [PROP.consumesInnerPassion, PROP.shatteredRidgeBoost, WEAPON.hengBlade, ATTACK.heavy, ATTUNE.snowpartingVariedCombo, ROLE.snowpartingVC],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingVC,
  castFrames: 52,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 2.0769,
      attributeMultiplier: 3.1153,
      physFixed: 575,
      attributeFixed: 313,
      triggers: [
        castSkill({ id: "tg-snowpartingvc-cast", target: SKILL.anxisoldierheng, stacks: 0 }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
