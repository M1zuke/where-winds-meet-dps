import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// In-game values as of 2026-09-24: +10% per stack against any non-player unit,
// 8 s, each stack restarts the window.
export const swordSlashDamageBoost = defineClassBuff({
  id: BUFF.swordSlashDamageBoost,
  name: "Sword Slash Damage Boost",
  duration: 8,
  maxStacks: 3,
  stacksPerHit: true,
  summary: "+10.0% all/stack",
  effects: (ctx) => (ctx.self.stacks > 0 ? [stat("allDamageBoost", 0.1 * ctx.self.stacks)] : []),
})
