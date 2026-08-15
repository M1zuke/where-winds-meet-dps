import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// The reference export gives one row for all three waves here, unlike the full
// cast. Splitting it by the full cast's ratios would invent a distribution
// nothing measures.
export const swordHeavyChargedPrepull = defineSkill({
  id: SKILL.swordHeavyChargedPrepull,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged[Prepull]",
  breakdownName: "Vagrant Sword (prepull)",
  tags: [PROP.isCharged, WEAPON.sword, ATTACK.heavy, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyChargedPrepull,
  triggersBuffs: [BUFF.swordSlashDamageBoost],
  receives: [
    BUFF.swordSlashDamageBoost,
    BUFF.swordEnergyEnhancement,
    BUFF.swordEnergyHpDamage,
    BUFF.swordMorphEnduranceBoost,
    BUFF.battleAnthemEnduranceBoost,
  ],
  castFrames: 51,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.5674,
      attributeMultiplier: 2.3511,
      physFixed: 314.6666666666667,
      attributeFixed: 179,
    }),
    hit(1, {
      frame: 17,
      physMultiplier: 1.5674,
      attributeMultiplier: 2.3511,
      physFixed: 314.6666666666667,
      attributeFixed: 179,
    }),
    hit(2, {
      frame: 34,
      physMultiplier: 1.5674,
      attributeMultiplier: 2.3511,
      physFixed: 314.6666666666667,
      attributeFixed: 179,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
