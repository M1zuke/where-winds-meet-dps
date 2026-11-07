import type { MeterDrain } from "../../../engine/skill"
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { VAGRANT_SWORD_2_HIT_MOTION } from "./rootMotion"
import {
  energySurgeCooldownCut,
  energySurgeReleaseTrigger,
  energySurgeEnduranceGain,
} from "./buffs/energySurgeGrant"
import { multiWaveWindowReleaseGrantTrigger } from "./buffs/multiWaveWindowGrant"
import { WUSHUANG_STANCE_ABSENT } from "./buffs/wushuangStance"
import { VAGRANT_SWORD_WAVE_PROJECTILE } from "./vagrantSwordBolts"
import {
  VAGRANT_SWORD_DRAIN,
  VAGRANT_SWORD_FREEZE,
  SWORD_MORPH_ENDURANCE_SPEND,
} from "./buffs/vagrantSwordEndurance"
import { BATTLE_ANTHEM_ENDURANCE_GAIN } from "./buffs/battleAnthemEnduranceGain"
import { MOUNTAINS_MIGHT_CHARGED_HIT_GAIN } from "./buffs/mountainsMightChargedHitGain"

// A hold whose drain would empty before the level-2 threshold never reaches
// a second wave at all — it releases onto the single-bolt form instead.
const DRAIN_WITH_CHARGE_RELEASE: MeterDrain[] = VAGRANT_SWORD_DRAIN.map((drain) => ({
  ...drain,
  chargeRelease: { fallbackSkillId: SKILL.swordHeavyCharged },
}))

export const swordHeavyCharged2Hit = defineSkill({
  id: SKILL.swordHeavyCharged2Hit,
  classId: "bellstrikeSplendor",
  name: "SwordHeavyCharged 2 Hit",
  breakdownName: "Vagrant Sword",
  tags: [PROP.isCharged, WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordHeavyCharged2Hit,
  // In-game values as of 2026-09-30: this press locks onto its target online,
  // a second server wait beyond the input's own before the release plays.
  serverWaitsInCast: 1,
  // In-game values as of 2026-09-24: a Deflect-cancelled 2nd wave of a
  // three-wave release only exists while Sword Morph's multi-wave window holds.
  castConditions: [
    { buffId: BUFF.swordMorphMultiWaveWindow, op: "gte", stacks: 1 },
    WUSHUANG_STANCE_ABSENT,
  ],
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
  // Cast length to the earliest next input: Deflect ends the release right
  // after the second wave's own launch, after an ≥84.6 f hold to the level-2
  // threshold (in-game values as of 2026-10-15).
  castFrames: 101.62,
  meterDrains: DRAIN_WITH_CHARGE_RELEASE,
  meterFreezes: VAGRANT_SWORD_FREEZE,
  triggerable: true,
  displacement: VAGRANT_SWORD_2_HIT_MOTION,
  hits: [
    hit(0, {
      frame: 90.66,
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
      frame: 100.62,
      projectile: VAGRANT_SWORD_WAVE_PROJECTILE,
      physMultiplier: 1.5679,
      attributeMultiplier: 2.3518,
      physFixed: 433.92,
      attributeFixed: 236.64,
      triggers: [energySurgeCooldownCut],
    }),
    hit(2, {
      // In-game values as of 2026-09-25: the Sword Morph conversion reads the
      // Endurance the charge drain left once it stops, at the release.
      frame: 84.6,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
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
