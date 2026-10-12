import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { forceOutcome, stat } from "../../../../engine/effects/effect"
import { BUFF, PARAM } from "../../buffs/ids"

// Towline Sweep rank 3 and up (in-game values as of 2026-10-12): Piercing
// Dart sweeps deal 5% more on sweeps 1-3, 10% more on 4-5 and 15% more on 6-7.
export const towlineSweepFirstSweepsBonus = defineClassBuff({
  id: BUFF.towlineSweepFirstSweepsBonus,
  name: "Towline Sweep (sweeps 1-3)",
  requires: { param: PARAM.towlineSweep, minTier: 3 },
  alwaysActive: true,
  duration: 9999,
  effects: [stat("allDamageBoost", 0.05)],
})

export const towlineSweepMiddleSweepsBonus = defineClassBuff({
  id: BUFF.towlineSweepMiddleSweepsBonus,
  name: "Towline Sweep (sweeps 4-5)",
  requires: { param: PARAM.towlineSweep, minTier: 3 },
  alwaysActive: true,
  duration: 9999,
  effects: [stat("allDamageBoost", 0.1)],
})

export const towlineSweepLastSweepsBonus = defineClassBuff({
  id: BUFF.towlineSweepLastSweepsBonus,
  name: "Towline Sweep (sweeps 6-7)",
  requires: { param: PARAM.towlineSweep, minTier: 3 },
  alwaysActive: true,
  duration: 9999,
  effects: [stat("allDamageBoost", 0.15)],
})

export const towlineSweepBurnAndBury = defineClassBuff({
  id: BUFF.towlineSweepBurnAndBury,
  name: "Towline Sweep (Burn and Bury)",
  requires: { param: PARAM.towlineSweep, minTier: 6 },
  alwaysActive: true,
  duration: 9999,
  effects: [stat("allDamageBoost", 0.15), forceOutcome("crit")],
})
