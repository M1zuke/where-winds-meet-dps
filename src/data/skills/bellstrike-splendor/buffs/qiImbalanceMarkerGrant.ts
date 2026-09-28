import { applyBuff } from "../../../../definitions/skills/triggers"
import { BUFF, PARAM } from "../../buffs/ids"

export const qiankunsLockQiImbalanceMarkerGrant = applyBuff({
  target: BUFF.qiImbalanceMarker,
  appliesOnCastEnd: true,
})

export const mountainsMightQiImbalanceMarkerGrant = applyBuff({
  target: BUFF.qiImbalanceMarker,
  appliesOnCastEnd: true,
  requiresParam: PARAM.mountainsMight,
})
