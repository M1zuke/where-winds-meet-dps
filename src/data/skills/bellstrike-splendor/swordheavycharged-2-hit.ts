import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { energySurgeReleaseTrigger, energySurgeEnduranceGain } from "./buffs/energySurgeGrant"
import { multiWaveWindowSustainTrigger } from "./buffs/multiWaveWindowGrant"
import {
  VAGRANT_SWORD_DISPLACEMENT,
  VAGRANT_SWORD_DRAIN,
  VAGRANT_SWORD_FREEZE,
  SWORD_MORPH_ENDURANCE_SPEND,
} from "./buffs/vagrantSwordEndurance"
import { BATTLE_ANTHEM_ENDURANCE_GAIN } from "./buffs/battleAnthemEnduranceGain"
import { MOUNTAINS_MIGHT_CHARGED_HIT_GAIN } from "./buffs/mountainsMightChargedHitGain"

export const swordHeavyCharged2Hit = defineSkill({
  id: SKILL.swordHeavyCharged2Hit,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged 2 Hit",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTACK.heavy, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyCharged2Hit,
  startLatency: "noWaitOnDummy",
  // In-game values as of 2026-09-24: a Deflect-cancelled 2nd wave of a
  // three-wave release only exists while Sword Morph's multi-wave window holds.
  castConditions: [{ buffId: BUFF.swordMorphMultiWaveWindow, op: "gte", stacks: 1 }],
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
  castFrames: 117,
  meterDrains: VAGRANT_SWORD_DRAIN,
  meterFreezes: VAGRANT_SWORD_FREEZE,
  triggerable: true,
  displacement: VAGRANT_SWORD_DISPLACEMENT,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.3066,
      attributeMultiplier: 1.9598,
      physFixed: 361.6,
      attributeFixed: 197.2,
      triggers: [
        energySurgeReleaseTrigger,
        multiWaveWindowSustainTrigger,
        BATTLE_ANTHEM_ENDURANCE_GAIN,
        energySurgeEnduranceGain,
        MOUNTAINS_MIGHT_CHARGED_HIT_GAIN,
      ],
    }),
    hit(1, {
      frame: 58,
      physMultiplier: 1.5679,
      attributeMultiplier: 2.3518,
      physFixed: 433.92,
      attributeFixed: 236.64,
      // In-game values as of 2026-09-25: the Sword Morph conversion reads the
      // Endurance the charge drain left once it stops, near this last wave.
      triggers: [SWORD_MORPH_ENDURANCE_SPEND],
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
