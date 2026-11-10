import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import {
  VAGRANT_SWORD_PREPULL_SINGLE_BOLT_MOTION,
  THREE_WAVE_FROM_CAST_START_MOTION,
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
  VAGRANT_SWORD_DRAIN,
  VAGRANT_SWORD_FREEZE,
  SWORD_MORPH_ENDURANCE_SPEND,
} from "./buffs/vagrantSwordEndurance"
import { VAGRANT_SWORD_WAVE_PROJECTILE } from "./vagrantSwordBolts"
import { BATTLE_ANTHEM_ENDURANCE_GAIN } from "./buffs/battleAnthemEnduranceGain"
import { MOUNTAINS_MIGHT_CHARGED_HIT_GAIN } from "./buffs/mountainsMightChargedHitGain"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-15: the release lands the three waves 6.06, 16.02 and
// 45.30 f later, each flying as a projectile.
export const swordHeavyChargedPrepull = defineSkill({
  id: SKILL.swordHeavyChargedPrepull,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged[Prepull]",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyChargedPrepull,
  // In-game values as of 2026-09-30: this press locks onto its target online,
  // a second server wait beyond the input's own before the release plays.
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
  castFrames: 37.2,
  meterDrains: VAGRANT_SWORD_DRAIN,
  meterFreezes: VAGRANT_SWORD_FREEZE,
  triggerable: true,
  displacement: VAGRANT_SWORD_PREPULL_SINGLE_BOLT_MOTION,
  hits: [
    hit(0, {
      frame: 12.14,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      ...levelScaled(LEVEL_ROWS.swordheavychargedHit0),
      triggers: [
        BATTLE_ANTHEM_ENDURANCE_GAIN,
        MOUNTAINS_MIGHT_CHARGED_HIT_GAIN,
        energySurgeCooldownCut,
      ],
      variants: [
        {
          id: "hv-swordheavycharged-prepull-hit-0-sword-morph",
          label: "Sword Morph",
          conditions: [SWORD_MORPH_EQUIPPED],
          ...levelScaled(LEVEL_ROWS.swordheavychargedHit0MultiWaveWindow),
          castFrames: 51,
          frame: 6.06,
          displacement: THREE_WAVE_FROM_CAST_START_MOTION,
        },
      ],
    }),
    hit(1, {
      frame: 16.02,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      ...levelScaled(LEVEL_ROWS.swordheavychargedHit1),
      conditions: [SWORD_MORPH_EQUIPPED],
      triggers: [energySurgeCooldownCut],
    }),
    hit(2, {
      frame: 45.3,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      ...levelScaled(LEVEL_ROWS.swordheavychargedHit2),
      conditions: [SWORD_MORPH_EQUIPPED],
      triggers: [energySurgeCooldownCut],
    }),
    hit(3, {
      frame: 0,
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
      ],
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
