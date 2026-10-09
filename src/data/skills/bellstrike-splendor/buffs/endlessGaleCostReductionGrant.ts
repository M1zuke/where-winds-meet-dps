import { applyBuff } from "../../../../definitions/skills/triggers"
import { BUFF, PARAM } from "../../buffs/ids"

export const endlessGaleAtStartGrant = applyBuff({
  target: BUFF.endlessGaleAtStart,
})

export const endlessGaleGrant = applyBuff({
  target: BUFF.endlessGale,
  appliesOnCastEnd: true,
})

// Extends the window `endlessGaleGrant` opens on this same hit, from its own
// 5s to 10s, while Mountain's Might holds.
export const endlessGaleMountainsMightExtend = applyBuff({
  target: BUFF.endlessGale,
  appliesOnCastEnd: true,
  extendFrames: 300,
  requiresParam: PARAM.mountainsMight,
})

export const endlessGaleCostReductionEndTrigger = applyBuff({
  target: BUFF.endlessGaleCostReductionEnd,
  appliesOnCastEnd: true,
  requiresParam: PARAM.mountainsMight,
})
