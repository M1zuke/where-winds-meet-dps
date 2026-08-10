import { defineBuff } from "./define"
import { BUFF, PARAM } from "./ids"
import { ROLE } from "../ids"
import { stat } from "../../../engine/effects/effect"

export const CROSSWIND_SPIRIT_BONUS = 0.15
export const CROSSWIND_MAX_CHARGES = 5

// The declaration only — the 0-5 charge counter that decides WHEN this is
// active is per-detonation state, modeled in `bellstrikeUmbraCrosswind.ts`'s
// `CrosswindTracker`, not here. This module is never seeded and never
// alwaysActive, so `BuffEngine` never applies it; it exists so the catalog's
// Bleed Detonation "Receives" row has a real `affects`/`effects` pair to read.
export const crosswindSpirit = defineBuff({
  id: BUFF.crosswindSpirit,
  name: "Crosswind Blade Spirit",
  specs: ["bellstrike_umbra"],
  requires: { param: PARAM.swordHorizon },
  affects: [ROLE.bleedDetonation],
  triggeredBy: [],
  duration: 999,
  effects: [stat("allDamageBoost", CROSSWIND_SPIRIT_BONUS)],
})
