import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { THREE_WAVE_FROM_CAST_START_MOTION } from "./rootMotion"
import {
  energySurgeConsumeTrigger,
  energySurgeCooldownCut,
  energySurgeReleaseTrigger,
  energySurgeEnduranceGain,
} from "./buffs/energySurgeGrant"
import { multiWaveWindowReleaseGrantTrigger } from "./buffs/multiWaveWindowGrant"
import { SWORD_MORPH_ENDURANCE_SPEND } from "./buffs/vagrantSwordEndurance"
import { BATTLE_ANTHEM_ENDURANCE_GAIN } from "./buffs/battleAnthemEnduranceGain"
import { VAGRANT_SWORD_WAVE_PROJECTILE } from "./vagrantSwordBolts"
import { enduranceMeter } from "../../resources/enduranceMeter"
import { LEVEL_ROWS } from "./levelRows"

export const energySurge = defineSkill({
  id: SKILL.energySurge,
  classId: "bellstrikeSplendor",
  name: "EnergySurge",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.energySurge,
  // In-game values as of 2026-09-30: this release locks onto its target
  // online, a second server wait beyond the input's own before it plays.
  serverWaitsInCast: 1,
  triggersBuffs: [BUFF.swordSlashDamageBoost],
  castConditions: [{ buffId: BUFF.energySurgeGrant, op: "gte", stacks: 1 }],
  receives: [
    BUFF.swordSlashDamageBoost,
    BUFF.swordEnergyEnhancement,
    BUFF.swordEnergyHpDamage,
    BUFF.swordMorphEnduranceBoost,
    BUFF.battleAnthemChargedDamage,
    BUFF.battleAnthemEnduranceBoost,
    ...NAMELESS_SWORD_RECEIVES,
  ],
  // In-game values as of 2026-09-25: 1 spent at the cast's own start.
  meterCosts: [{ meterId: enduranceMeter.id, amount: 1 }],
  castFrames: 51,
  triggerable: true,
  // In-game values as of 2026-09-28: 18 m reach on its own companion
  // projectile — the longest confirmed number for this class.
  reachMeters: 18,
  displacement: THREE_WAVE_FROM_CAST_START_MOTION,
  hits: [
    hit(0, {
      frame: 6.06,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      ...levelScaled(LEVEL_ROWS.swordheavychargedHit0MultiWaveWindow),
      triggers: [BATTLE_ANTHEM_ENDURANCE_GAIN, energySurgeCooldownCut],
    }),
    hit(1, {
      frame: 16.02,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      ...levelScaled(LEVEL_ROWS.swordheavychargedHit1),
      triggers: [energySurgeCooldownCut],
    }),
    hit(2, {
      frame: 45.3,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      ...levelScaled(LEVEL_ROWS.swordheavychargedHit2),
      triggers: [energySurgeCooldownCut],
    }),
    hit(3, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        energySurgeConsumeTrigger,
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
