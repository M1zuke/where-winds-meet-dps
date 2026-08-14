import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const phalanxchargedS3 = defineSkill({
  id: SKILL.phalanxchargedS3,
  classId: "stonesplitStrength",
  name: "PhalanxCharged-S3",
  tags: [
    PROP.isCharged,
    PROP.shatteredRidgeBoost,
    WEAPON.moBlade,
    ATTACK.charge,
    ATTUNE.phalanxbaneCharged,
    ROLE.phalanxCharged,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.phalanxChargedS3,
  receives: [BUFF.mountainSplitter, BUFF.shatteredRidgeDeflect],
  triggersBuffs: [BUFF.throatPierced, BUFF.chargeEnhancement],
  castFrames: 188,
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
      frame: 94,
      physMultiplier: 4.0131,
      attributeMultiplier: 6.0196,
      physFixed: 1110,
      attributeFixed: 604,
      triggers: [castSkill({ target: SKILL.anxisoldiermodown, stacks: 0 })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
