import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { cleftpeak } from "../../sets/cleftpeak"
import { applyBuff } from "../../../engine/effects/effect"

const FULL_STACKS = 5

// In-game set effect as of 2026-09-24: a successful deflect grants the full 5 stacks.
export const cleftpeakDeflectGrant = defineBuff({
  id: BUFF.cleftpeakDeflectGrant,
  name: "Cleftpeak (Deflect)",
  requires: { set: cleftpeak.siteKey },
  duration: 0.1,
  effects: [applyBuff(BUFF.cleftpeakStacks, FULL_STACKS), applyBuff(BUFF.cleftpeakDeflect, FULL_STACKS)],
})
