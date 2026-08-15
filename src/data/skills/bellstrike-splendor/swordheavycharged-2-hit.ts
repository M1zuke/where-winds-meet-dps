import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const swordHeavyCharged2Hit = defineSkill({
  id: SKILL.swordHeavyCharged2Hit,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged 2 Hit",
  breakdownName: "Vagrant Sword (2 waves)",
  tags: [PROP.isCharged, WEAPON.sword, ATTACK.heavy, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyCharged2Hit,
  castFrames: 117,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.3066,
      attributeMultiplier: 1.9598,
      physFixed: 302,
      attributeFixed: 168,
    }),
    hit(1, {
      frame: 58,
      physMultiplier: 1.5679,
      attributeMultiplier: 2.3518,
      physFixed: 362,
      attributeFixed: 202,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
