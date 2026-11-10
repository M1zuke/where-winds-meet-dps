import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

const MAX_PHYS_ATTACK_STEP = 100
const HP_DAMAGE_PER_STEP = 0.02
const HP_DAMAGE_CAP = 0.2

// "Increases the Sword Energy attack's Qi damage dealt to players and HP damage
// to non-player units by 2% for every 100 Max Physical Attack, up to 20%
// increase at 1,000 Max Physical Attack" (in-game English text, 2026-08-15).
//
// The engine simulates a non-player target, so the HP-damage branch is the live
// one. HP damage is the whole hit rather than its physical half, and the
// reference workbook files this family in the additive whole-hit column it
// shares with the sibling `swordSlashDamageBoost`.
export const swordEnergyHpDamage = defineClassBuff({
  id: BUFF.swordEnergyHpDamage,
  name: "Sword Energy HP Damage",
  alwaysActive: true,
  readsLiveMaxPhysAttack: true,
  duration: 9999,
  summary: "HP damage +2% per full 100 Max Physical Attack (max 20%)",
  effects: (ctx) =>
    ctx.self.reachesEvent
      ? [
          stat(
            "allDamageBoost",
            Math.min(
              HP_DAMAGE_CAP,
              Math.floor(ctx.build.maxPhysAttack / MAX_PHYS_ATTACK_STEP) * HP_DAMAGE_PER_STEP,
            ),
          ),
        ]
      : [],
})
