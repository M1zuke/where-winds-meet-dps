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
  // In-game values as of 2026-09-30: this press locks onto its target online,
  // a second server wait beyond the input's own before the release plays.
  serverWaitsInCast: 1,
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
  meterDrains: VAGRANT_SWORD_DRAIN,
  meterFreezes: VAGRANT_SWORD_FREEZE,
  triggerable: true,
  displacement: VAGRANT_SWORD_DISPLACEMENT,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 3.2664,
      attributeMultiplier: 4.8996,
      physFixed: 904,
      attributeFixed: 493,
      triggers: [
        energySurgeReleaseTrigger,
        multiWaveWindowSustainTrigger,
        BATTLE_ANTHEM_ENDURANCE_GAIN,
        energySurgeEnduranceGain,
        MOUNTAINS_MIGHT_CHARGED_HIT_GAIN,
      ],
      variants: [
        {
          id: "hv-swordheavycharged-hit-0-multi-wave-window",
          label: "Multi-Wave Window",
          conditions: [MULTI_WAVE_WINDOW_ACTIVE],
          physMultiplier: 1.3066,
          attributeMultiplier: 1.9598,
          physFixed: 361.6,
          attributeFixed: 197.2,
          // Cast length to the earliest next input for a full ≥84 f hold to
          // the level-2 threshold plus the three-wave release's own cast
          // length (in-game values as of 2026-09-24).
          castFrames: 135,
          frame: 90,
        },
      ],
    }),
    hit(1, {
      frame: 100,
      physMultiplier: 1.5679,
      attributeMultiplier: 2.3518,
      physFixed: 433.92,
      attributeFixed: 236.64,
      conditions: [MULTI_WAVE_WINDOW_ACTIVE],
    }),
    hit(2, {
      frame: 129,
      physMultiplier: 1.8292,
      attributeMultiplier: 2.7438,
      physFixed: 506.24,
      attributeFixed: 276.08,
      conditions: [MULTI_WAVE_WINDOW_ACTIVE],
      // In-game values as of 2026-09-25: the Sword Morph conversion reads the
      // Endurance the charge drain left once it stops, near this last wave.
      triggers: [{ ...SWORD_MORPH_ENDURANCE_SPEND, condition: MULTI_WAVE_WINDOW_ACTIVE }],
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
