import { defineBuff } from "./define"
import { BUFF } from "./ids"
import { CAST } from "../ids"

export const rainwhisperShield = defineBuff({
  id: BUFF.rainwhisperShield,
  name: "HP Shield",
  triggeredBy: [CAST.goldenBodyCancel, CAST.goldenBodyDeflectCancel, CAST.moBladeQ, CAST.moBladeQPrepull],
  affects: [],
  duration: (ctx) =>
    ctx.event.kind === "cast" &&
    (ctx.event.castTag === CAST.goldenBodyCancel || ctx.event.castTag === CAST.goldenBodyDeflectCancel)
      ? 12
      : 8,
  effects: [],
})
