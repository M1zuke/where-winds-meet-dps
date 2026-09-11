import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { damageMultiplier } from "../../../engine/effects/effect"

// "Deals 40% more base damage to non-player units" on Peakfall, Castlink,
// their Jadeflush forms and Dragonquench - Inebriate; the Nightwick series
// carries the same factor. A factor on the skill's own coefficient, so it
// multiplies the whole hit rather than joining the boost sum (in-game damage
// tooltips, ×1.2 and ×1.4 non-player ratios, 2026-09-05). The engine only
// simulates a non-player target.
export const nonPlayerBaseDamage40 = defineBuff({
  id: BUFF.nonPlayerBaseDamage40,
  name: "Non-Player Base DMG +40%",
  requires: { classId: "bamboocutDraught" },
  alwaysActive: true,
  duration: 9999,
  summary: "damage ×1.4 against non-player units on the gauntlets skills",
  effects: (ctx) => (ctx.self.reachesEvent ? [damageMultiplier(1.4)] : []),
})

// "Deals 50% more base damage to non-player units" on Hero's Blood -
// Inebriate and Boundvessel (in-game skill text, 2026-09-04), applied the
// same way.
export const nonPlayerBaseDamage50 = defineBuff({
  id: BUFF.nonPlayerBaseDamage50,
  name: "Non-Player Base DMG +50%",
  requires: { classId: "bamboocutDraught" },
  alwaysActive: true,
  duration: 9999,
  summary: "damage ×1.5 against non-player units on the twinblades Inebriate skills",
  effects: (ctx) => (ctx.self.reachesEvent ? [damageMultiplier(1.5)] : []),
})
