import { defineDebuff } from "../../../definitions/skills/skillDef"
import type { Debuff } from "../../../engine/debuff"
import { BUFF } from "../buffs/ids"
import { DEBUFF } from "./ids"

const CLASS_ID = "bamboocutDust"

export const bitterSeasonTick = defineDebuff({
  id: DEBUFF.bitterSeasonTick,
  classId: CLASS_ID,
  name: "Bitter Season Tick",
  activation: "triggered",
  durationFrames: 300,
  effects: [],
  dot: {
    tickIntervalFrames: 60,
    // In-game cadence as of 2026-10-11.
    reschedulesPerTick: true,
    // In-game values as of 2026-09-24.
    physMultiplier: 0.02,
    physFixed: 0,
    attributeMultiplier: 0,
    attributeFixed: 0,
    attributeAttack: "Bamboocut",
    skillType: "sustain",
    weaponOrAttribute: null,
    mysticCategory: null,
    count: 1,
    perStackShapes: null,
    perStackMultipliers: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
  receives: [BUFF.soulShaken],
})

// In-game values as of 2026-10-12: seven stacks within 5 s convert into Soulbreak.
export const SOUL_LOSS_STACKS_FOR_SOULBREAK = 7

export const soulLoss = defineDebuff({
  id: DEBUFF.soulLoss,
  classId: CLASS_ID,
  name: "Soul Loss",
  activation: "triggered",
  durationFrames: 300,
  effects: [],
  dot: null,
  maxStacks: SOUL_LOSS_STACKS_FOR_SOULBREAK,
  stackScaling: "flat",
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})

export const SOULBREAK_DURATION_FRAMES = 720
export const SOULBREAK_TOWLINE_SWEEP_DURATION_FRAMES = 1260

export const soulbreak = defineDebuff({
  id: DEBUFF.soulbreak,
  classId: CLASS_ID,
  name: "Soulbreak",
  activation: "triggered",
  durationFrames: SOULBREAK_DURATION_FRAMES,
  effects: [],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})

const SOULBREAK_PAYOUT_ECHO = {
  breakdownName: "Soulbreak",
  skillType: "mindMethod",
}

// In-game values as of 2026-10-12: Towline Sweep ranks 4-5 pay 5% of the
// damage dealt while Soulbreak was up when it ends, rank 6 pays 10%.
export const SOULBREAK_PAYOUT_FIVE_PERCENT_MIN_TIER = 4
export const SOULBREAK_PAYOUT_TEN_PERCENT_MIN_TIER = 6

export const soulbreakPayoutFivePercent = defineDebuff({
  id: DEBUFF.soulbreakPayoutFivePercent,
  classId: CLASS_ID,
  name: "Soulbreak End Damage (5%)",
  activation: "triggered",
  durationFrames: SOULBREAK_TOWLINE_SWEEP_DURATION_FRAMES,
  effects: [],
  dot: null,
  echo: { share: 0.05, ...SOULBREAK_PAYOUT_ECHO },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})

export const soulbreakPayoutTenPercent = defineDebuff({
  id: DEBUFF.soulbreakPayoutTenPercent,
  classId: CLASS_ID,
  name: "Soulbreak End Damage (10%)",
  activation: "triggered",
  durationFrames: SOULBREAK_TOWLINE_SWEEP_DURATION_FRAMES,
  effects: [],
  dot: null,
  echo: { share: 0.1, ...SOULBREAK_PAYOUT_ECHO },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})

export const DEBUFFS: readonly Debuff[] = [
  bitterSeasonTick,
  soulLoss,
  soulbreak,
  soulbreakPayoutFivePercent,
  soulbreakPayoutTenPercent,
]
