import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const snowpartingvcPrepull = defineSkill({
  id: SKILL.snowpartingvcPrepull,
  classId: "stonesplitStrength",
  name: "SnowpartingVC Prepull",
  tags: [PROP.consumesInnerPassion, PROP.shatteredRidgeBoost, WEAPON.hengBlade, ATTACK.heavy, ATTUNE.snowpartingVariedCombo, ROLE.snowpartingVC],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingVCPrepull,
  castFrames: 6,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 2.0764,
      attributeMultiplier: 3.1145,
      physFixed: 480,
      attributeFixed: 268,
      triggers: [
        castSkill({ id: "tg-snowpartingvc-prepull-cast", target: SKILL.anxisoldierheng, stacks: 0 }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
