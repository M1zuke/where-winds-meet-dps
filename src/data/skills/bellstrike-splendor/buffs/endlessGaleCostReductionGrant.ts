import { applyBuff, clearStatus } from "../../../../definitions/skills/triggers"
import { BUFF, PARAM } from "../../buffs/ids"
import { ENDLESS_GALE_AT_START_GATE } from "../../../classes/bellstrike-splendor/gates"

const NO_MOUNTAINS_MIGHT_ENDLESS_GALE = {
  buffId: BUFF.endlessGaleCostReductionEnd,
  op: "lte",
  stacks: 0,
} as const

export const endlessGaleAtStartGrant = applyBuff({
  target: BUFF.endlessGaleAtStart,
  condition: NO_MOUNTAINS_MIGHT_ENDLESS_GALE,
})

export const endlessGaleAtStartRestart = applyBuff({
  target: BUFF.endlessGaleAtStart,
  appliesOnCastEnd: true,
  extendFrames: ENDLESS_GALE_AT_START_GATE.durationFrames,
  maxExtendedDurationFrames: ENDLESS_GALE_AT_START_GATE.durationFrames,
  extendOnly: true,
})

export const endlessGaleAtStartDispel = clearStatus({
  target: BUFF.endlessGaleAtStart,
  appliesOnCastEnd: true,
  requiresParam: PARAM.mountainsMight,
})

export const endlessGaleGrant = applyBuff({
  target: BUFF.endlessGale,
  appliesOnCastEnd: true,
})

// Extends the window `endlessGaleGrant` opens on this same hit, from its own
// 5s to 10s, while Mountain's Might holds. The cap keeps an older window still
// running from being pushed past 10s from this cast's end.
export const endlessGaleMountainsMightExtend = applyBuff({
  target: BUFF.endlessGale,
  appliesOnCastEnd: true,
  extendFrames: 300,
  maxExtendedDurationFrames: 600,
  requiresParam: PARAM.mountainsMight,
})

export const endlessGaleCostReductionEndTrigger = applyBuff({
  target: BUFF.endlessGaleCostReductionEnd,
  appliesOnCastEnd: true,
  requiresParam: PARAM.mountainsMight,
})
