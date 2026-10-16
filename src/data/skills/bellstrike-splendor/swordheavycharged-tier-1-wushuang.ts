import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { VAGRANT_SWORD_TIER_1_WUSHUANG_MOTION } from "./rootMotion"
import {
  VAGRANT_SWORD_FREEZE,
  VAGRANT_SWORD_WUSHUANG_TIER_1_DRAIN,
} from "./buffs/vagrantSwordEndurance"
import { energySurgeCooldownCut } from "./buffs/energySurgeGrant"
import { BATTLE_ANTHEM_ENDURANCE_GAIN } from "./buffs/battleAnthemEnduranceGain"
import { MOUNTAINS_MIGHT_CHARGED_HIT_GAIN } from "./buffs/mountainsMightChargedHitGain"
import { WUSHUANG_STANCE_ACTIVE } from "./buffs/wushuangStance"
import { VAGRANT_SWORD_TIER_1_PROJECTILE } from "./vagrantSwordBolts"

// In-game values as of 2026-10-15: under Wushuang Stance the first charge tier
// is reached 34.4 f after the press, and its clip plays at ×1.5, so the single
// bolt launches 8.09 f later and the cast ends 24.8 f later. The stance is not
// spent.
export const swordHeavyChargedTier1Wushuang = defineSkill({
  id: SKILL.swordHeavyChargedTier1Wushuang,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged Tier 1 (Wushuang Stance)",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyChargedTier1,
  serverWaitsInCast: 1,
  castConditions: [WUSHUANG_STANCE_ACTIVE],
  triggersBuffs: [BUFF.swordSlashDamageBoost],
  receives: [
    BUFF.swordSlashDamageBoost,
    BUFF.swordEnergyEnhancement,
    BUFF.swordEnergyHpDamage,
    BUFF.battleAnthemChargedDamage,
    BUFF.battleAnthemEnduranceBoost,
    ...NAMELESS_SWORD_RECEIVES,
  ],
  castFrames: 59.2,
  meterDrains: VAGRANT_SWORD_WUSHUANG_TIER_1_DRAIN,
  meterFreezes: VAGRANT_SWORD_FREEZE,
  triggerable: true,
  displacement: VAGRANT_SWORD_TIER_1_WUSHUANG_MOTION,
  hits: [
    hit(0, {
      frame: 42.49,
      physMultiplier: 1.51032,
      attributeMultiplier: 2.26548,
      physFixed: 419,
      attributeFixed: 228,
      projectile: VAGRANT_SWORD_TIER_1_PROJECTILE,
      triggers: [
        BATTLE_ANTHEM_ENDURANCE_GAIN,
        MOUNTAINS_MIGHT_CHARGED_HIT_GAIN,
        energySurgeCooldownCut,
      ],
    }),
  ],
  createdAt: "2026-10-16T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
})
