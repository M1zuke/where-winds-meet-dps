import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// In-game capture (2026-08-19, Jadebreak tooltip):
//
//   "Increases Projectile skill damage by 30%. When a Projectile Skill or
//    Heavy Attack Pursuit skill hits a Boss unit, deals 10% more damage.
//    This effect lasts 15 seconds."
//
// Granted by Emerald Barrier (Fan Special) on cast and by Peak's Springless
// Silence (Fan dash) on-hit against Airborne / Lingering Bone'd targets.
// Lasts 15 seconds in both cases.
//
// "Projectile skill damage" is mapped to the umbrella-side umbrellaBoost
// stat key because Mun's doc describes Jade's projectile damage profile as
// the umbrella path (Q, drone, tornado, Flying). The five umbrella-side
// files all carry `WEAPON.umbrella` (the umbrella-boost tile in the formula
// is the umbrella-column row, see `formula.ts` line 314). The fan-side
// FanSpecial file carries `WEAPON.fan`, so this buff doesn't double-boost
// when Emerald Barrier itself lands — that's by design (Emerald Barrier's
// own damage is fan-side, not part of Jade's projectile damage profile).
//
// The "+10% Boss damage" clause is gated by `!ctx.target.isTrainingDummy` —
// the engine has no `target.isBoss` primitive as of 2026-08-19, and the
// test/training-dummy simulation is the only non-Boss target the engine
// models. If the engine later gains a real `target.isBoss`, this gate should
// swap to that.
export const jadebreak = defineClassBuff({
  id: BUFF.jadebreak,
  name: "Jadebreak",
  duration: 15,
  summary: "umbrellaBoost +30%, +10% Boss damage on Projectile/Heavy Pursuit hit",
  effects: (ctx) => {
    const out = [stat("umbrellaBoost", 0.3)]
    if (!ctx.target.isTrainingDummy) {
      out.push(stat("allDamageBoost", 0.1))
    }
    return out
  },
})
