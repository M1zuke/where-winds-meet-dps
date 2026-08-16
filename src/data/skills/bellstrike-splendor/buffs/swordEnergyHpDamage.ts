import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// "Increases the Sword Energy attack's Qi damage dealt to players and HP damage
// to non-player units by 2% for every 100 Max Physical Attack, up to 20%
// increase at 1,000 Max Physical Attack" (client localization, 2026-08-15).
//
// The engine simulates a non-player target, so the HP-damage branch is the live
// one. HP damage is the whole hit rather than its physical half, and the
// reference workbook files this family in the additive whole-hit column it
// shares with the sibling `swordSlashDamageBoost`. Carried at the cap, which a
// realistic build clears well before 1,000 Max Physical Attack.
export const swordEnergyHpDamage = defineClassBuff({
  id: BUFF.swordEnergyHpDamage,
  name: "Sword Energy HP Damage",
  alwaysActive: true,
  duration: 9999,
  summary: "HP damage +20%",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("allDamageBoost", 0.2)] : []),
})
