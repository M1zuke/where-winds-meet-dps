import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import {
  VAGRANT_SWORD_WUSHUANG_SINGLE_BOLT_MOTION,
  VAGRANT_SWORD_WUSHUANG_THREE_WAVE_MOTION,
} from "./rootMotion"
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
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-15: under Wushuang Stance every press charges at
// ×1.5, so the level-2 threshold is reached after 48 f of real hold, not 72 f.
// The three-wave release resets the speed to 1; the single level-2 bolt does
// not and plays at ×1.5.
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
  castConditions: [WUSHUANG_STANCE_ACTIVE],
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
  castFrames: 85.2,
  meterDrains: VAGRANT_SWORD_WUSHUANG_DRAIN,
  meterFreezes: VAGRANT_SWORD_FREEZE,
  triggerable: true,
  displacement: VAGRANT_SWORD_WUSHUANG_SINGLE_BOLT_MOTION,
  hits: [
    hit(0, {
      frame: 68.49,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      ...levelScaled(LEVEL_ROWS.swordheavychargedHit0),
      triggers: [
        BATTLE_ANTHEM_ENDURANCE_GAIN,
        MOUNTAINS_MIGHT_CHARGED_HIT_GAIN,
        energySurgeCooldownCut,
      ],
      variants: [
        {
          id: "hv-swordheavycharged-wushuang-hit-0-sword-morph",
          label: "Sword Morph",
          conditions: [SWORD_MORPH_EQUIPPED],
          ...levelScaled(LEVEL_ROWS.swordheavychargedHit0MultiWaveWindow),
          castFrames: 111.4,
          frame: 66.46,
          displacement: VAGRANT_SWORD_WUSHUANG_THREE_WAVE_MOTION,
        },
      ],
    }),
    hit(1, {
      frame: 76.42,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      ...levelScaled(LEVEL_ROWS.swordheavychargedHit1),
      conditions: [SWORD_MORPH_EQUIPPED],
      triggers: [energySurgeCooldownCut],
    }),
    hit(2, {
      frame: 105.7,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      ...levelScaled(LEVEL_ROWS.swordheavychargedHit2),
      conditions: [SWORD_MORPH_EQUIPPED],
      triggers: [energySurgeCooldownCut],
    }),
    hit(3, {
      frame: 60.4,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      conditions: [SWORD_MORPH_EQUIPPED],
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
