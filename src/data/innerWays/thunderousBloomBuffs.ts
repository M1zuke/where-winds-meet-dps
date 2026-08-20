import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"

// In-game Attune Effect text (2026-08-20): completing a Martial Art Skill
// cast grants 5 Spring Thunder stacks, once per 15s, retained up to 12s; a
// qualifying hit spends 1 stack for +15% damage on that hit and the next 2s,
// non-stacking; while stacks live, a qualifying hit on an Exhausted or
// below-30%-Qi target restores 1 stack, 2s cooldown. The restore tops up the
// proc's own 12s window rather than extending it — the 15s/12s cycle is the
// stated retention cap, not a refreshable duration.
export const springThunder = defineBuff({
  id: BUFF.springThunder,
  name: "Spring Thunder",
  requires: { param: PARAM.thunderousBloom },
  buffAppliesOnCastEnd: true,
  rateLimit: { count: 1, window: 15 },
  duration: 12,
  maxStacks: 5,
  stacks: () => 5,
  stackOnDamage: true,
  stackOnDamagePhase: ["below30", "exhausted"],
  stackOnDamageScoped: true,
  stackOnDamageOnlyWhileActive: true,
  stackOnDamageRateLimit: { count: 1, window: 2 },
  effects: [],
})

export const thunderousBloomBuffDef = defineBuff({
  id: BUFF.thunderousBloom,
  name: "Spring Thunder DMG Boost",
  requires: { param: PARAM.thunderousBloom },
  perHitConsume: { from: BUFF.springThunder },
  duration: 2,
  effects: [stat("allDamageBoost", 0.15)],
})
