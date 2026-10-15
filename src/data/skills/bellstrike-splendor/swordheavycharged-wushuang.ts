import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
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
  VAGRANT_SWORD_DISPLACEMENT,
  VAGRANT_SWORD_FREEZE,
  VAGRANT_SWORD_WUSHUANG_DRAIN,
  SWORD_MORPH_ENDURANCE_SPEND,
} from "./buffs/vagrantSwordEndurance"
import { WUSHUANG_STANCE_ACTIVE, wushuangStanceConsume } from "./buffs/wushuangStance"
import { BATTLE_ANTHEM_ENDURANCE_GAIN } from "./buffs/battleAnthemEnduranceGain"
import { MOUNTAINS_MIGHT_CHARGED_HIT_GAIN } from "./buffs/mountainsMightChargedHitGain"

// In-game values as of 2026-10-15: under Wushuang Stance the charge plays at
// ×1.5, so the level-2 threshold is reached after 48 f of real hold, not 72 f;
// the release itself runs at normal speed.
export const swordHeavyChargedWushuang = defineSkill({
  id: SKILL.swordHeavyChargedWushuang,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged (Wushuang Stance)",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyCharged,
  castConditions: [SWORD_MORPH_EQUIPPED, WUSHUANG_STANCE_ACTIVE],
  startLatency: "noWaitOnDummy",
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
  castFrames: 111,
  meterDrains: VAGRANT_SWORD_WUSHUANG_DRAIN,
  meterFreezes: VAGRANT_SWORD_FREEZE,
  triggerable: true,
  displacement: VAGRANT_SWORD_DISPLACEMENT,
  hits: [
    hit(0, {
      frame: 66,
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
      frame: 76,
      physMultiplier: 1.5679,
      attributeMultiplier: 2.3518,
      physFixed: 433.92,
      attributeFixed: 236.64,
      triggers: [energySurgeCooldownCut],
    }),
    hit(2, {
      frame: 105,
      physMultiplier: 1.8292,
      attributeMultiplier: 2.7438,
      physFixed: 506.24,
      attributeFixed: 276.08,
      triggers: [SWORD_MORPH_ENDURANCE_SPEND, energySurgeCooldownCut],
    }),
    hit(3, {
      frame: 60,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        energySurgeReleaseTrigger,
        multiWaveWindowReleaseGrantTrigger,
        energySurgeEnduranceGain,
        wushuangStanceConsume,
      ],
    }),
  ],
  createdAt: "2026-10-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
