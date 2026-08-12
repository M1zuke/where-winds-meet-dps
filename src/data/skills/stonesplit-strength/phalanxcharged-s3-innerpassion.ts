import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const phalanxchargedS3Innerpassion = defineSkill({
  id: SKILL.phalanxchargedS3Innerpassion,
  classId: "stonesplitStrength",
  name: "PhalanxCharged-S3[InnerPassion]",
  tags: [
    PROP.isCharged,
    PROP.shatteredRidgeBoost,
    PROP.consumesInnerPassionBurningHeart,
    WEAPON.moBlade,
    ATTACK.charge,
    ATTUNE.phalanxbaneCharged,
    ROLE.phalanxCharged,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.phalanxChargedS3InnerPassion,
  castFrames: 138,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.7199,
      attributeMultiplier: 2.5798,
      physFixed: 475,
      attributeFixed: 259,
    }),
    hit(1, {
      frame: 69,
      physMultiplier: 4.0131,
      attributeMultiplier: 6.0196,
      physFixed: 1110,
      attributeFixed: 604,
      triggers: [
        castSkill({
          id: "tg-phalanxcharged-s3-innerpassion-cast",
          target: SKILL.anxisoldiermodown,
          stacks: 0,
        }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
