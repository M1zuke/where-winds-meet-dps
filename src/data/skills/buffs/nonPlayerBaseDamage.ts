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

// In-game text as of 2026-09-24: Forsaken Fame and Moon Shatter Spring each
// deal an extra 45% damage against non-player targets.
export const nonPlayerBaseDamage145 = defineBuff({
  id: BUFF.nonPlayerBaseDamage145,
  name: "Non-Player Base DMG +45%",
  requires: { classId: "silkbindJade" },
  alwaysActive: true,
  duration: 9999,
  summary: "damage ×1.45 against non-player units on Forsaken Fame and Moon Shatter Spring",
  effects: (ctx) => (ctx.self.reachesEvent ? [damageMultiplier(1.45)] : []),
})

// In-game values as of 2026-09-24: the floating umbrella's projectiles deal an
// extra 15% damage against non-player targets.
export const nonPlayerBaseDamage115 = defineBuff({
  id: BUFF.nonPlayerBaseDamage115,
  name: "Non-Player Base DMG +15%",
  requires: { classId: "silkbindJade" },
  alwaysActive: true,
  duration: 9999,
  summary: "damage ×1.15 against non-player units on the floating umbrella's projectiles",
  effects: (ctx) => (ctx.self.reachesEvent ? [damageMultiplier(1.15)] : []),
})

// In-game values as of 2026-09-24: Spring Away deals an extra 25% damage
// against non-player targets.
export const nonPlayerBaseDamage125 = defineBuff({
  id: BUFF.nonPlayerBaseDamage125,
  name: "Non-Player Base DMG +25%",
  requires: { classId: "silkbindJade" },
  alwaysActive: true,
  duration: 9999,
  summary: "damage ×1.25 against non-player units on Spring Away",
  effects: (ctx) => (ctx.self.reachesEvent ? [damageMultiplier(1.25)] : []),
})
