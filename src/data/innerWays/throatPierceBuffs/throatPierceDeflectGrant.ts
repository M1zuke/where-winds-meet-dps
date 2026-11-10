import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { applyBuff } from "../../../engine/effects/effect"

const FULL_STACKS = 5

// In-game values as of 2026-11-10: a successful Deflect at rank 6 lays all
// five Throat-Pierced stacks, once per 20 s, whatever martial art is drawn.
export const throatPierceDeflectGrant = defineBuff({
  id: BUFF.throatPierceDeflectGrant,
  name: "Throat-Pierce (Deflect)",
  requires: { param: PARAM.throatPierced, minTier: 6 },
  duration: 0.1,
  cooldown: 20,
  effects: [applyBuff(BUFF.throatPierced, FULL_STACKS)],
})
