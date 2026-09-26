import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { energySurgeReleaseTrigger } from "./buffs/energySurgeGrant"
import { multiWaveWindowSustainTrigger } from "./buffs/multiWaveWindowGrant"

const MULTI_WAVE_WINDOW_ACTIVE = {
  buffId: BUFF.swordMorphMultiWaveWindow,
  op: "gte" as const,
  stacks: 1,
}

export const swordHeavyCharged = defineSkill({
  id: SKILL.swordHeavyCharged,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTACK.heavy, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyCharged,
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
  // In-game values as of 2026-09-24: without Sword Morph's multi-wave window
  // this is the single-bolt level-2 release, not the three-wave one below.
  castFrames: 126,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 3.2664,
      attributeMultiplier: 4.8996,
      physFixed: 904,
      attributeFixed: 493,
      triggers: [energySurgeReleaseTrigger, multiWaveWindowSustainTrigger],
      variants: [
        {
          id: "hv-swordheavycharged-hit-0-multi-wave-window",
          label: "Multi-Wave Window",
          conditions: [MULTI_WAVE_WINDOW_ACTIVE],
          physMultiplier: 1.3066,
          attributeMultiplier: 1.9598,
          physFixed: 361.6,
          attributeFixed: 197.2,
          castFrames: 140,
        },
      ],
    }),
    hit(1, {
      frame: 46,
      physMultiplier: 1.5679,
      attributeMultiplier: 2.3518,
      physFixed: 433.92,
      attributeFixed: 236.64,
      conditions: [MULTI_WAVE_WINDOW_ACTIVE],
    }),
    hit(2, {
      frame: 92,
      physMultiplier: 1.8292,
      attributeMultiplier: 2.7438,
      physFixed: 506.24,
      attributeFixed: 276.08,
      conditions: [MULTI_WAVE_WINDOW_ACTIVE],
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
