import { defineResource } from "../../../definitions/resources/resourceDef"
import { SKILL, DEBUFF } from "../../skills/silkbind-jade/ids"
import { WEAPON } from "../../skills/ids"
import { BUFF, PARAM } from "../../skills/buffs/ids"

// In-game resource and Unfading Flower text: reference/locale/zhToEnOfficial.json.
export const BLOSSOMS = {
  capacity: 100,
  launchMinimum: 50,
  drainPerSecond: 10,
  lingeringBoneRunCost: 5,
  endRefund: 15,
  endRefundCooldownSeconds: 5,
} as const

export const blossomResource = defineResource({
  id: "blossoms",
  name: "Blossoms",
  capacity: BLOSSOMS.capacity,
  defaultOpening: BLOSSOMS.capacity,
  defaultExhaustedGainPerTick: 3,
  // In-game values as of 2026-09-24.
  regenPerSecond: 0.3,
  launchMinimum: BLOSSOMS.launchMinimum,
  launchSkillId: SKILL.umbdronelaunch,
  debuffId: DEBUFF.umbdrone,
  drainPerSecond: BLOSSOMS.drainPerSecond,
  enhancedRunCost: BLOSSOMS.lingeringBoneRunCost,
  recallTag: WEAPON.umbrella,
  recallExemptSkillIds: [
    SKILL.hiddenSwordLight1,
    SKILL.hiddenSwordLight2,
    SKILL.hiddenSwordLight3,
    SKILL.hiddenSwordLight4,
    SKILL.hiddenSwordLight5,
    SKILL.hiddenSwordHeavy1,
    SKILL.hiddenSwordHeavy2,
    SKILL.hiddenSwordHeavy3,
    SKILL.hiddenSwordHeavyAlt,
  ],
  endRefund: BLOSSOMS.endRefund,
  refundCooldownSeconds: BLOSSOMS.endRefundCooldownSeconds,
  gains: [
    // Every umbrella hit that grants Blossoms is already tied to its own named
    // skill below; the drone's own ticks earn Blossoms only through the
    // Qi-0 refund (`defaultExhaustedGainPerTick`). A nonzero value here would
    // double-pay them. In-game values as of 2026-09-30.
    { id: "directHit", name: "Umbrella hit", defaultAmount: 0, tag: WEAPON.umbrella },
    {
      id: "qHit",
      name: "Spring Sorrow base gain",
      // In-game values as of 2026-09-24.
      defaultAmount: 20,
      skillIds: [SKILL.umbq],
    },
    {
      id: "heavyLightCast",
      name: "Heavy Light base gain",
      // In-game values as of 2026-10-02: heavy stage 1 (+5), Colorful Phoenix
      // +4 per hit over this module's 3 hits, and +4 for each of its 7 checks
      // for an enemy within 3 m.
      defaultAmount: 45,
      skillIds: [SKILL.umbHeavylight],
      divideAcrossSkillHits: true,
    },
    {
      id: "chargedHit",
      name: "Spring Away bullet gain",
      // In-game values as of 2026-09-30: 3.4 per hover bullet, this module's
      // 6 modelled hits.
      defaultAmount: 3.4 * 6,
      skillIds: [SKILL.umblightcharge],
      divideAcrossSkillHits: true,
    },
    {
      id: "chargedHit12",
      name: "Spring Away 12-bullet gain",
      // In-game values as of 2026-10-06: 3.4 per hover bullet, this module's
      // 12 modelled hits.
      defaultAmount: 3.4 * 12,
      skillIds: [SKILL.umblightcharge12],
      divideAcrossSkillHits: true,
    },
    {
      id: "umbrellaDashBullet",
      name: "Umbrella - Dash bullet gain",
      // In-game values as of 2026-10-06: +4 on the bullet hit, paid across
      // this module's 3 hits.
      defaultAmount: 4,
      skillIds: [SKILL.umbrellaDash],
      divideAcrossSkillHits: true,
    },
    {
      id: "chargedHitLift",
      name: "Spring Away lift gain",
      // In-game values as of 2026-09-30.
      defaultAmount: 4,
      skillIds: [SKILL.umblightchargeLift],
    },
    {
      id: "apricotHeavenHit",
      name: "Apricot Heaven gain",
      // In-game values as of 2026-10-06: +5 per hit, 2 hits per cast.
      defaultAmount: 10,
      skillIds: [SKILL.apricotHeavenNormal, SKILL.apricotHeavenEnhanced],
      divideAcrossSkillHits: true,
    },
    {
      id: "bambooBreezeHit",
      name: "Bamboo Breeze gain",
      // In-game values as of 2026-09-24: +3 per hit, 2 hits per cast.
      defaultAmount: 6,
      skillIds: [SKILL.bambooBreeze],
      divideAcrossSkillHits: true,
    },
    {
      id: "tier6",
      name: "Blossom Barrage T6",
      defaultAmount: 25,
      skillIds: [SKILL.umbq],
      oncePerCast: true,
      requiresParam: PARAM.blossomBarrage,
      minTier: 6,
      requiresBuff: BUFF.combo,
    },
  ],
})

export const legacyDroneSkillIds = [
  SKILL.umbdronelaunch12Hit,
  SKILL.umbdronelaunch16Hit,
  SKILL.umbdronelaunch20Hit,
  SKILL.umbdronelaunch23Hit,
  SKILL.umbdronelaunch26Hit,
]

export const JADE_SOURCES = {
  patch20: "https://www.wherewindsmeetgame.com/news/official/723update.html",
  patch21: "https://www.wherewindsmeetgame.com/news/official/CloudedRevelationPatchNotes.html",
  patch17: "https://www.wherewindsmeetgame.com/news/official/Adjustment528.html",
} as const
