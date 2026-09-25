import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { CAST } from "../ids"

export const rainwhisperShield = defineBuff({
  id: BUFF.rainwhisperShield,
  name: "HP Shield",
  // In-game values as of 2026-09-24: the shield lasts 10 s from 0.5 s after
  // the cast.
  duration: (ctx) =>
    ctx.event.kind === "cast" &&
    (ctx.event.castTag === CAST.goldenBodyCancel || ctx.event.castTag === CAST.goldenBodyDeflectCancel)
      ? 10.5
      : 8,
  effects: [],
})
