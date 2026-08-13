import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const phalanxq = defineSkill({
  id: SKILL.phalanxq,
  classId: "stonesplitStrength",
  name: "PhalanxQ",
  tags: [WEAPON.moBlade, ATTUNE.phalanxbaneQ, PROP.shatteredRidgeBoost, ROLE.phalanxQ],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.phalanxQ,
  castFrames: 49,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.8948,
      attributeMultiplier: 2.8422,
      physFixed: 525,
      attributeFixed: 286,
      triggers: [
        castSkill({ id: "tg-phalanxq-cast", target: SKILL.anxisoldiermosweep, stacks: 0 }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
