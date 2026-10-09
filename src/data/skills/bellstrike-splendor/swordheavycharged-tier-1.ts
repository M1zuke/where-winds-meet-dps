import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import {
  VAGRANT_SWORD_DISPLACEMENT,
  VAGRANT_SWORD_FREEZE,
  VAGRANT_SWORD_TIER_1_DRAIN,
} from "./buffs/vagrantSwordEndurance"
import { energySurgeCooldownCut } from "./buffs/energySurgeGrant"
import { BATTLE_ANTHEM_ENDURANCE_GAIN } from "./buffs/battleAnthemEnduranceGain"
import { MOUNTAINS_MIGHT_CHARGED_HIT_GAIN } from "./buffs/mountainsMightChargedHitGain"

// In-game values as of 2026-10-06: released at the earliest first-tier hold
// (45 f); the single bolt launches at 57 f.
export const swordHeavyChargedTier1 = defineSkill({
  id: SKILL.swordHeavyChargedTier1,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged Tier 1",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyChargedTier1,
  startLatency: "noWaitOnDummy",
  serverWaitsInCast: 1,
  triggersBuffs: [BUFF.swordSlashDamageBoost],
  receives: [
    BUFF.swordSlashDamageBoost,
    BUFF.swordEnergyEnhancement,
    BUFF.swordEnergyHpDamage,
    BUFF.battleAnthemChargedDamage,
    BUFF.battleAnthemEnduranceBoost,
    ...NAMELESS_SWORD_RECEIVES,
  ],
  castFrames: 82,
  meterDrains: VAGRANT_SWORD_TIER_1_DRAIN,
  meterFreezes: VAGRANT_SWORD_FREEZE,
  triggerable: true,
  displacement: VAGRANT_SWORD_DISPLACEMENT,
  hits: [
    hit(0, {
      frame: 57,
      physMultiplier: 1.51032,
      attributeMultiplier: 2.26548,
      physFixed: 419,
      attributeFixed: 228,
      projectile: { speedMetersPerSecond: 36, maxTravelFrames: 24 },
      triggers: [
        BATTLE_ANTHEM_ENDURANCE_GAIN,
        MOUNTAINS_MIGHT_CHARGED_HIT_GAIN,
        energySurgeCooldownCut,
      ],
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
