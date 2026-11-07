import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { artBonus, stat } from "../../../engine/effects/effect"
import { ivorybloom } from "../../sets/ivorybloom"

// "At Max HP, there is a bonus 5% chance to deal Critical healing and damage,
// and increases the effects of Critical healing and damage by 15%." (in-game
// set tooltip, 2026-09-24.) The app never damages the player, so this is
// permanent on a dummy. The rate add lands after resistance, inside the crit
// cap, same as a skill's own rate bonus (docs/CALCULATION.md § "Calculation
// rules").
export const ivorybloomFullHpBonus = defineBuff({
  id: BUFF.ivorybloomFullHpBonus,
  name: "Ivorybloom",
  requires: { set: ivorybloom.siteKey },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "critRate +5% (inside the cap), critDamage +15%",
  effects: [artBonus("extraCritRate", 0.05), stat("critDamageBoost", 0.15)],
})
