import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { finalCritAtLeast, stat } from "../../../engine/effects/effect"

export const mountainSplitterExhausted = defineBuff({
  id: BUFF.mountainSplitterExhausted,
  name: "Mountain Splitter (Exhausted target)",
  requires: { param: PARAM.steadfastDevotion, minTier: 6 },
  alwaysActive: true,
  duration: 9999,
  summary:
    "on an Exhausted target without Mountain Splitter: critDamageBoost +10%, guaranteed crit at 70% final crit rate or higher, else +15% crit rate",
  effects: (ctx) =>
    ctx.self.reachesEvent &&
    ctx.phase === "exhausted" &&
    !ctx.status.isActive(BUFF.mountainSplitter)
      ? [stat("critDamageBoost", 0.1), finalCritAtLeast(0.7, 0.15)]
      : [],
})
