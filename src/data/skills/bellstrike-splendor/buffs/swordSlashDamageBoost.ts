import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// "Applied by Nameless Sword's sword energy attacks. Each stack increases sword
// energy damage by 5%. Against non-player units, the damage bonus is 8% per
// stack, or 10% while they are Exhausted" (client localization, 2026-08-15).
// The engine simulates a non-player target, so the player figure never applies.
export const swordSlashDamageBoost = defineClassBuff({
  id: BUFF.swordSlashDamageBoost,
  name: "Sword Slash Damage Boost",
  duration: 15,
  maxStacks: 3,
  stacksPerHit: true,
  summary: "+8.0% all/stack, +10.0% while Exhausted",
  effects: (ctx) =>
    ctx.self.stacks > 0
      ? [stat("allDamageBoost", (ctx.phase === "exhausted" ? 0.1 : 0.08) * ctx.self.stacks)]
      : [],
})
