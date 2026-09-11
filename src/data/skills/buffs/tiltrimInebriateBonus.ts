import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { tiltrim } from "../../sets/tiltrim"
import { isInebriate } from "../bamboocut-draught/buffs/inebriate"

// At 5 Tiltrim stacks, Inebriate-enhanced skills deal a further 5% HP damage
// (in-game set text, 2026-09-06).
export const tiltrimInebriateBonus = defineBuff({
  id: BUFF.tiltrimInebriateBonus,
  name: "Tiltrim (Max Stacks)",
  requires: { set: tiltrim.siteKey },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +5% on Inebriate-enhanced skills at 5 Tiltrim stacks",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx) && ctx.status.stacks(BUFF.tiltrimStack) >= 5
      ? [stat("allDamageBoost", 0.05)]
      : [],
})
