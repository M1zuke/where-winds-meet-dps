import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import {
  energySurgeConsumeTrigger,
  energySurgeReleaseTrigger,
  energySurgeEnduranceGain,
} from "./buffs/energySurgeGrant"
import { multiWaveWindowReleaseGrantTrigger } from "./buffs/multiWaveWindowGrant"
import {
  SWORD_MORPH_ENDURANCE_SPEND,
  VAGRANT_SWORD_DISPLACEMENT,
} from "./buffs/vagrantSwordEndurance"
import { BATTLE_ANTHEM_ENDURANCE_GAIN } from "./buffs/battleAnthemEnduranceGain"
import { enduranceMeter } from "../../resources/enduranceMeter"

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
  displacement: VAGRANT_SWORD_DISPLACEMENT,
  hits: [
    hit(0, {
      frame: 6,
      physMultiplier: 1.3066,
      attributeMultiplier: 1.9598,
      physFixed: 361.6,
      attributeFixed: 197.2,
      triggers: [
        energySurgeConsumeTrigger,
        energySurgeReleaseTrigger,
        multiWaveWindowReleaseGrantTrigger,
        SWORD_MORPH_ENDURANCE_SPEND,
        BATTLE_ANTHEM_ENDURANCE_GAIN,
        energySurgeEnduranceGain,
      ],
    }),
    hit(1, {
      frame: 16,
      physMultiplier: 1.5679,
      attributeMultiplier: 2.3518,
      physFixed: 433.92,
      attributeFixed: 236.64,
    }),
    hit(2, {
      frame: 45,
      physMultiplier: 1.8292,
      attributeMultiplier: 2.7438,
      physFixed: 506.24,
      attributeFixed: 276.08,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
