import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { ATTACK } from "../ids"
import { stat } from "../../../engine/effects/effect"
import { mistwillow } from "../../sets/mistwillow"
import { MISTWILLOW_BONUS } from "./mistwillowBuff"

export const mistwillowLightBuff = defineBuff({
  id: BUFF.mistwillowLightBuff,
  name: "Mistwillow (Light)",
  requires: { set: mistwillow.siteKey },
  duration: 15,
  cooldown: 2,
  summary: "phys +10%, attribute damage +10% — half on a mixed light/heavy skill",
  effects: (ctx) => {
    const share = ctx.event.kind === "damage" && ctx.event.tags.has(ATTACK.mixed) ? 0.5 : 1
    return [stat("physBoost", MISTWILLOW_BONUS * share), stat("attributeDamageBoost", MISTWILLOW_BONUS * share)]
  },
})
