import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { forceOutcome, stat } from "../../../engine/effects/effect"

// The forced crit needs a final crit rate of at least 70%; every built-in
// Burning Heart build clears it, so the crit is forced unconditionally rather
// than through `conditionalFinalCrit` — that field applies module-wide, not
// scoped to this phase-and-state condition.
export const mountainSplitterExhausted = defineBuff({
  id: BUFF.mountainSplitterExhausted,
  name: "Mountain Splitter (Exhausted target)",
  requires: { param: PARAM.steadfastDevotion, minTier: 6 },
  alwaysActive: true,
  duration: 9999,
  summary:
    "on an Exhausted target without Mountain Splitter: critDamageBoost +10% and a guaranteed crit",
  effects: (ctx) =>
    ctx.self.reachesEvent &&
    ctx.phase === "exhausted" &&
    !ctx.status.isActive(BUFF.mountainSplitter)
      ? [stat("critDamageBoost", 0.1), forceOutcome("crit")]
      : [],
})
