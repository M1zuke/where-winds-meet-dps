import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { CAST } from "../ids"

export const rainwhisperShield = defineBuff({
  id: BUFF.rainwhisperShield,
  name: "HP Shield",
  duration: (ctx) =>
    ctx.event.kind === "cast" &&
    (ctx.event.castTag === CAST.goldenBodyCancel || ctx.event.castTag === CAST.goldenBodyDeflectCancel)
      ? 12
      : 8,
  effects: [],
})
