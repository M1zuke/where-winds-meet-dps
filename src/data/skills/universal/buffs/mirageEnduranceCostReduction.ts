import { defineGateBuff } from "../../../../definitions/skills/skillDef"
import { applyBuff } from "../../../../definitions/skills/triggers"
import type { Buff } from "../../../../engine/buff"
import { enduranceMeter } from "../../../resources/enduranceMeter"
import { BUFF } from "../../buffs/ids"
import { WEAPON } from "../../ids"

// In-game values as of 2026-09-29: Ghostly Steps' Mystery grants two
// Endurance cost cuts for the same 30s window `mirage` opens (a recast
// refreshes both, matching that window's own refresh) — a class-scoped -40%
// on dodges only and an unscoped -10% on every spend, two different in-game
// formulas that multiply rather than add (docs/TIMELINE.md § "Meters").
export const MIRAGE_ENDURANCE_COST_REDUCTION_GATE: Buff = defineGateBuff({
  id: BUFF.mirageEnduranceCostReduction,
  classId: "universal",
  name: "Mirage — Endurance Cost Reduction",
  description: "Dodge Endurance cost -40%, every Endurance cost a further -10%, for 30s.",
  scope: "player",
  activation: "triggered",
  durationFrames: 1800,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  meterModifiers: [
    { meterId: enduranceMeter.id, kind: "cost", amount: -0.4, tag: WEAPON.none },
    { meterId: enduranceMeter.id, kind: "cost", amount: -0.1 },
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})

export const mirageEnduranceCostReductionGrant = applyBuff({
  target: BUFF.mirageEnduranceCostReduction,
})
