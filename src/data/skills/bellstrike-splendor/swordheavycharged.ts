import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const swordHeavyCharged = defineSkill({
  id: SKILL.swordHeavyCharged,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTACK.heavy, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyCharged,
  triggersBuffs: [BUFF.swordSlashDamageBoost],
  receives: [
    BUFF.swordSlashDamageBoost,
    BUFF.swordEnergyEnhancement,
    BUFF.swordEnergyHpDamage,
    BUFF.swordMorphEnduranceBoost,
    BUFF.battleAnthemEnduranceBoost,
  ],
  castFrames: 140,
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
      frame: 46,
      physMultiplier: 1.5679,
      attributeMultiplier: 2.3518,
      physFixed: 362,
      attributeFixed: 202,
    }),
    hit(2, {
      frame: 92,
      physMultiplier: 1.8292,
      attributeMultiplier: 2.7438,
      physFixed: 422,
      attributeFixed: 236,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
