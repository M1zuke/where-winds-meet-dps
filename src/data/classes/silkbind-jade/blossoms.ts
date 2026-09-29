import { defineResource } from "../../../definitions/resources/resourceDef"
import { SKILL, DEBUFF } from "../../skills/silkbind-jade/ids"
import { WEAPON } from "../../skills/ids"
import { BUFF, PARAM } from "../../skills/buffs/ids"

// In-game resource and Unfading Flower text: reference/locale/zhToEnOfficial.json.
export const BLOSSOMS = {
  capacity: 100,
  launchMinimum: 50,
  drainPerSecond: 10,
  lingeringBoneExtraDrainPerSecond: 10,
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
  enhancedBuffId: BUFF.lingeringBone,
  enhancedExtraDrainPerSecond: BLOSSOMS.lingeringBoneExtraDrainPerSecond,
  endRefund: BLOSSOMS.endRefund,
  refundCooldownSeconds: BLOSSOMS.endRefundCooldownSeconds,
  gains: [
    {
      id: "launchCost",
      name: "Unfading Flower cost",
      defaultAmount: -10,
      skillIds: [SKILL.umbdronelaunch],
    },
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
      // In-game values as of 2026-09-24.
      defaultAmount: 45,
      skillIds: [SKILL.umbHeavylight],
      divideAcrossSkillHits: true,
    },
    {
      id: "chargedHit",
      name: "Additional Spring Away gain",
      defaultAmount: 0,
      skillIds: [SKILL.umblightcharge],
    },
    {
      id: "apricotHeavenHit",
      name: "Apricot Heaven gain",
      // In-game values as of 2026-09-24: +4 per hit, 2 hits per cast.
      defaultAmount: 8,
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
