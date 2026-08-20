import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// Moon Shatter Spring — "Shattered Spring" / "Startling Spring" buff
// (in-game capture, 2026-08-19, verbatim):
//
//   "Hitting a non-player enemy with the three-hit combo and the enhanced
//    five-hit combo deals 45% bonus damage and grants you one stack of
//    Shattered Spring."
//
// Option 1 from the design-Q resolution: Shattered Spring and Startling
// Spring are the same buff under two localizations — one file.
//
// The "+45% bonus damage" is the unconditional flat bonus per Moon Shatter
// Spring cast that hits a non-player enemy. The engine simulates a
// non-player target, so this branch is unconditional within the simulation.
// (In PvE the gate would be `!ctx.target.isTrainingDummy` + a future
// `target.isPlayer` field; the simulation has no `isPlayer` primitive yet.)
//
// The per-stack scaling (`+4% charged-skill damage per stack, +20% at max
// stacks of 5`) is the implementation choice the user confirmed at
// "encode and flag for review" time. The 2026-08-19 tooltip did not include a
// numeric value for the stack track; the +4% figure is a provisional
// implementation that matches the design's tiered-pattern (each of the 5
// stacks adds equal chunks). Verify against an in-game number once a
// capture is available.
//
// "Filtered to charged skills" was the original plan; effects in the engine
// currently cannot filter by `isCharged`, so the stat is unconditional.
// Engine extension for `prop`-gated effects is out of scope for this sprint.
export const startlingSpring = defineClassBuff({
  id: BUFF.startlingSpring,
  name: "Startling Spring",
  duration: 15,
  maxStacks: 5,
  stacksPerHit: true,
  summary: "+45% all damage; +4% per stack",
  effects: (ctx) => {
    const out: ReturnType<typeof stat>[] = [stat("allDamageBoost", 0.45)]
    if (ctx.self.stacks > 0) {
      out.push(stat("attributeDamageBoost", 0.04 * ctx.self.stacks))
    }
    return out
  },
})