import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { VAGRANT_SWORD_2_HIT_WUSHUANG_MOTION } from "./rootMotion"
import {
  energySurgeCooldownCut,
  energySurgeReleaseTrigger,
  energySurgeEnduranceGain,
} from "./buffs/energySurgeGrant"
import {
  multiWaveWindowReleaseGrantTrigger,
  SWORD_MORPH_EQUIPPED,
} from "./buffs/multiWaveWindowGrant"
import {
  VAGRANT_SWORD_FREEZE,
  VAGRANT_SWORD_WUSHUANG_DRAIN,
  SWORD_MORPH_ENDURANCE_SPEND,
} from "./buffs/vagrantSwordEndurance"
import { WUSHUANG_STANCE_ACTIVE, wushuangStanceConsume } from "./buffs/wushuangStance"
import { BATTLE_ANTHEM_ENDURANCE_GAIN } from "./buffs/battleAnthemEnduranceGain"
import { MOUNTAINS_MIGHT_CHARGED_HIT_GAIN } from "./buffs/mountainsMightChargedHitGain"
import { VAGRANT_SWORD_WAVE_PROJECTILE } from "./vagrantSwordBolts"

// In-game values as of 2026-10-15: the Deflect-cancelled second wave of the
// Wushuang Stance three-wave release, ended right after the wave that follows
// the 60.4 f release.
export const swordHeavyCharged2HitWushuang = defineSkill({
  id: SKILL.swordHeavyCharged2HitWushuang,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged 2 Hit (Wushuang Stance)",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyCharged2Hit,
  castConditions: [SWORD_MORPH_EQUIPPED, WUSHUANG_STANCE_ACTIVE],
  serverWaitsInCast: 1,
  triggersBuffs: [BUFF.swordSlashDamageBoost],
  receives: [
    BUFF.swordSlashDamageBoost,
    BUFF.swordEnergyEnhancement,
    BUFF.swordEnergyHpDamage,
    BUFF.swordMorphEnduranceBoost,
    BUFF.battleAnthemChargedDamage,
    BUFF.battleAnthemEnduranceBoost,
    ...NAMELESS_SWORD_RECEIVES,
  ],
  castFrames: 77.42,
  meterDrains: VAGRANT_SWORD_WUSHUANG_DRAIN,
  meterFreezes: VAGRANT_SWORD_FREEZE,
  triggerable: true,
  displacement: VAGRANT_SWORD_2_HIT_WUSHUANG_MOTION,
  hits: [
    hit(0, {
      frame: 66.46,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      physMultiplier: 1.3066,
      attributeMultiplier: 1.9598,
      physFixed: 361.6,
      attributeFixed: 197.2,
      triggers: [
        BATTLE_ANTHEM_ENDURANCE_GAIN,
        MOUNTAINS_MIGHT_CHARGED_HIT_GAIN,
        energySurgeCooldownCut,
      ],
    }),
    hit(1, {
      frame: 76.42,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      physMultiplier: 1.5679,
      attributeMultiplier: 2.3518,
      physFixed: 433.92,
      attributeFixed: 236.64,
      triggers: [energySurgeCooldownCut],
    }),
    hit(2, {
      frame: 60.4,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        energySurgeReleaseTrigger,
        multiWaveWindowReleaseGrantTrigger,
        SWORD_MORPH_ENDURANCE_SPEND,
        energySurgeEnduranceGain,
        wushuangStanceConsume,
      ],
    }),
  ],
  createdAt: "2026-10-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
