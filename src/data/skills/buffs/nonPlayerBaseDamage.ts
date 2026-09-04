import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"

// "Deals 40% more base damage to non-player units" on Peakfall, Castlink,
// their Jadeflush forms and Dragonquench - Inebriate; the Nightwick series
// carries the same 1.4 in the workbook without a client sentence (client
// locale text and workbook v2.0, 2026-09-04). The engine only simulates a
// non-player target.
export const nonPlayerBaseDamage40 = defineBuff({
  id: BUFF.nonPlayerBaseDamage40,
  name: "Non-Player Base DMG +40%",
  requires: { classId: "bamboocutDraught" },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +40% against non-player units on the gauntlets skills",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("allDamageBoost", 0.4)] : []),
})

// "Deals 50% more base damage to non-player units" on Hero's Blood -
// Inebriate and Boundvessel (client locale text, 2026-09-04).
export const nonPlayerBaseDamage50 = defineBuff({
  id: BUFF.nonPlayerBaseDamage50,
  name: "Non-Player Base DMG +50%",
  requires: { classId: "bamboocutDraught" },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +50% against non-player units on the twinblades Inebriate skills",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("allDamageBoost", 0.5)] : []),
})
