import type { Buff } from "../../../engine/buff"
import { defineGateBuff } from "../../../definitions/skills/skillDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { enduranceMeter } from "../../resources/enduranceMeter"

const CLASS_ID = "bellstrikeSplendor"

// In-game values as of 2026-09-24: a multi-wave sword-energy release (a
// three-wave Vagrant Sword, its two-wave variant, the pre-pull form or
// Energy Surge itself) grants one Energy Surge, usable for this long.
export const ENERGY_SURGE_GRANT_DURATION_FRAMES = 300

export const ENERGY_SURGE_GRANT_GATE: Buff = defineGateBuff({
  id: BUFF.energySurgeGrant,
  classId: CLASS_ID,
  name: "Energy Surge Available",
  description: "Granted by a multi-wave sword-energy release; spent by casting Energy Surge.",
  scope: "player",
  activation: "triggered",
  durationFrames: ENERGY_SURGE_GRANT_DURATION_FRAMES,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})

// In-game values as of 2026-09-24: Sword Morph's multi-wave window. Held out
// of combat or on a Qi Shield too — neither has a build-side equivalent this
// engine can read, so only the window path is modelled.
export const MULTI_WAVE_WINDOW_DURATION_FRAMES = 300

export const MULTI_WAVE_WINDOW_GATE: Buff = defineGateBuff({
  id: BUFF.swordMorphMultiWaveWindow,
  classId: CLASS_ID,
  name: "Sword Morph Multi-Wave Window",
  description: "Vagrant Sword's level-2 release fires three waves while this holds.",
  scope: "player",
  activation: "triggered",
  durationFrames: MULTI_WAVE_WINDOW_DURATION_FRAMES,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.swordMorph,
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})

// In-game values as of 2026-09-26: the Nameless Spear talent's own +10 %
// Endurance regeneration below 30 % of the current cap — no timed window of
// its own, so `meterModifiers`' `belowCapacityFraction` gates it on the
// meter's own live value instead of this buff's window.
export const NAMELESS_SPEAR_ENDURANCE_REGEN_GATE: Buff = defineGateBuff({
  id: BUFF.namelessSpearEnduranceRegen,
  classId: CLASS_ID,
  name: "Nameless Spear — Endurance Regeneration",
  description: "+10% Endurance regeneration while below 30% of the current cap.",
  scope: "player",
  activation: "triggered",
  durationFrames: 1,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  meterModifiers: [
    { meterId: enduranceMeter.id, kind: "regen", amount: 0.1, belowCapacityFraction: 0.3 },
  ],
  createdAt: "2026-09-26T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
})

// In-game values as of 2026-09-28: Qiankun's Lock opens this 5 s window at its
// own cast start. This gate owns the window and the -10% Endurance cost it
// also carries; the `endlessGaleAtStart` class-buff module reads this same id
// for its own +18% affinity damage.
export const ENDLESS_GALE_AT_START_GATE: Buff = defineGateBuff({
  id: BUFF.endlessGaleAtStart,
  classId: CLASS_ID,
  name: "Endless Gale (from Qiankun's Lock's start)",
  description: "5s from Qiankun's Lock's own cast start; all Endurance costs -10%.",
  scope: "player",
  activation: "triggered",
  durationFrames: 300,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  meterModifiers: [
    { meterId: enduranceMeter.id, kind: "cost", amount: -0.1 },
    { meterId: enduranceMeter.id, kind: "chargeCost", amount: -0.1 },
  ],
  createdAt: "2026-09-26T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})

// In-game values as of 2026-09-28: Qiankun's Lock's own end opens this window
// too, 5s on its own, extended to 10s by a separate `extendFrames` trigger
// while Mountain's Might holds. This gate owns the window; the `endlessGale`
// class-buff module reads this same id for +18% affinity damage. It carries
// no `meterModifiers` of its own — the Endurance cost reduction below only
// ever exists alongside Mountain's Might's own separate buff, so it stays its
// own entity rather than widen this window's meaning to something a build
// without Mountain's Might would wrongly read as discounted too.
export const ENDLESS_GALE_GATE: Buff = defineGateBuff({
  id: BUFF.endlessGale,
  classId: CLASS_ID,
  name: "Endless Gale (from Qiankun's Lock's end)",
  description: "5s from Qiankun's Lock's own cast end, extended to 10s with Mountain's Might.",
  scope: "player",
  activation: "triggered",
  durationFrames: 300,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-28T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})

// In-game values as of 2026-09-26: with Mountain's Might, Qiankun's Lock's end
// also cuts every Endurance cost by 20%, charge and sprint a further 10% on
// top — folded here into one -28% charge modifier (the engine composes
// same-kind modifiers additively, so the compound 0.8 x 0.9 = 0.72 is
// authored directly rather than as two stacked -20/-10 entries, matching the
// reference charge cost of 17.3 from a base 24). A window of its own rather
// than a `meterModifiers` entry on `ENDLESS_GALE_GATE`: that gate's window
// exists at 5s without Mountain's Might too, where no cost reduction applies
// at all.
export const ENDLESS_GALE_COST_REDUCTION_END_GATE: Buff = defineGateBuff({
  id: BUFF.endlessGaleCostReductionEnd,
  classId: CLASS_ID,
  name: "Endless Gale — Cost Reduction (from Qiankun's Lock's end)",
  description:
    "All Endurance costs -20%, charge costs a further -10%, for 10s with Mountain's Might.",
  scope: "player",
  activation: "triggered",
  durationFrames: 600,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.mountainsMight,
  meterModifiers: [
    { meterId: enduranceMeter.id, kind: "cost", amount: -0.2 },
    { meterId: enduranceMeter.id, kind: "chargeCost", amount: -0.28 },
  ],
  createdAt: "2026-09-26T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
})

// In-game values as of 2026-09-26: Battle Anthem tiers 4-5 raise charged
// skills' own charge-drain cost by 10% — a flat build-tier condition with no
// timed window or proc of its own, replaced at tier 6 by the Endurance-
// consumed damage bonus (`battleAnthemEnduranceBoost`).
export const BATTLE_ANTHEM_CHARGE_COST_INCREASE_GATE: Buff = defineGateBuff({
  id: BUFF.battleAnthemChargeCostIncrease,
  classId: CLASS_ID,
  name: "Battle Anthem — Charge Cost Increase",
  description: "Charged skills' Endurance charge cost +10% at tiers 4-5.",
  scope: "player",
  activation: "permanent",
  durationFrames: 1,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.battleAnthem,
  requiresMinTier: 4,
  requiresMaxTier: 5,
  meterModifiers: [
    { meterId: enduranceMeter.id, kind: "chargeCost", amount: 0.1, alwaysActive: true },
  ],
  createdAt: "2026-09-26T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
})

// In-game values as of 2026-09-26: mirrors the target's own Qi Imbalance
// window (a class-buff engine status, invisible to the layout pass) so
// Mountain's Might's own per-hit Endurance gain can gate on it there.
export const QI_IMBALANCE_MARKER_GATE: Buff = defineGateBuff({
  id: BUFF.qiImbalanceMarker,
  classId: CLASS_ID,
  name: "Qi Imbalance (Endurance marker)",
  description: "Mirrors the target's own Qi Imbalance window for the layout pass.",
  scope: "player",
  activation: "triggered",
  durationFrames: 900,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-26T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
})

// In-game values as of 2026-09-29: Relentless Chase's second strike is only
// offered while this 6 s window (granted by the first strike) holds.
export const RELENTLESS_CHASE_WINDOW_GATE: Buff = defineGateBuff({
  id: BUFF.relentlessChaseWindow,
  classId: CLASS_ID,
  name: "Relentless Chase Available",
  description: "Granted by Relentless Chase's first strike; spent by casting its second.",
  scope: "player",
  activation: "triggered",
  durationFrames: 360,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})

// In-game values as of 2026-09-29: a defensive marker only — a Vagrant Sword
// pressed while it holds fires the same three-wave release the timed
// multi-wave window already models, so this buff itself carries no further
// reads.
export const QI_SHIELD_GATE: Buff = defineGateBuff({
  id: BUFF.qiShield,
  classId: CLASS_ID,
  name: "Qi Shield",
  description: "Granted by Relentless Chase's second strike; a defensive marker.",
  scope: "player",
  activation: "triggered",
  durationFrames: 180,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})

// In-game values as of 2026-09-29: granted by a Legion Crusher hit; read by
// the Wushuang-Stance-accelerated Storm Dance forms' own `castConditions`.
export const WUSHUANG_STANCE_GATE: Buff = defineGateBuff({
  id: BUFF.wushuangStance,
  classId: CLASS_ID,
  name: "Wushuang Stance",
  description: "Granted by a Legion Crusher hit; speeds up the next Storm Dance.",
  scope: "player",
  activation: "triggered",
  durationFrames: 180,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})

export const BELLSTRIKE_SPLENDOR_GATES: readonly Buff[] = [
  ENERGY_SURGE_GRANT_GATE,
  MULTI_WAVE_WINDOW_GATE,
  NAMELESS_SPEAR_ENDURANCE_REGEN_GATE,
  ENDLESS_GALE_AT_START_GATE,
  ENDLESS_GALE_GATE,
  ENDLESS_GALE_COST_REDUCTION_END_GATE,
  BATTLE_ANTHEM_CHARGE_COST_INCREASE_GATE,
  QI_IMBALANCE_MARKER_GATE,
  RELENTLESS_CHASE_WINDOW_GATE,
  QI_SHIELD_GATE,
  WUSHUANG_STANCE_GATE,
]
