import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { energySurgeReleaseTrigger } from "./buffs/energySurgeGrant"

export const swordHeavyChargedPrepull = defineSkill({
  id: SKILL.swordHeavyChargedPrepull,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged[Prepull]",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTACK.heavy, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyChargedPrepull,
  startLatency: "noWaitOnDummy",
  triggersBuffs: [BUFF.swordSlashDamageBoost],
  receives: [
    BUFF.mistwillowLightBuff,
    BUFF.mistwillowBuff,
    BUFF.swordSlashDamageBoost,
    BUFF.swordEnergyEnhancement,
    BUFF.swordEnergyHpDamage,
    BUFF.swordMorphEnduranceBoost,
    BUFF.battleAnthemChargedDamage,
    BUFF.battleAnthemEnduranceBoost,
    ...NAMELESS_SWORD_RECEIVES,
  ],
  castFrames: 51,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.3066,
      attributeMultiplier: 1.9598,
      physFixed: 361.6,
      attributeFixed: 197.2,
      triggers: [energySurgeReleaseTrigger],
    }),
    hit(1, {
      frame: 17,
      physMultiplier: 1.5679,
      attributeMultiplier: 2.3518,
      physFixed: 433.92,
      attributeFixed: 236.64,
    }),
    hit(2, {
      frame: 34,
      physMultiplier: 1.8292,
      attributeMultiplier: 2.7438,
      physFixed: 506.24,
      attributeFixed: 276.08,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
