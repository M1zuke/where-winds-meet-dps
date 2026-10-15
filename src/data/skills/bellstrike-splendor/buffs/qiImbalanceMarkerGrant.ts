import { applyBuff } from "../../../../definitions/skills/triggers"
import { BUFF, PARAM } from "../../buffs/ids"

export const qiankunsLockQiImbalanceMarkerGrant = applyBuff({
  target: BUFF.qiImbalanceMarker,
})

export const mountainsMightQiImbalanceMarkerGrant = applyBuff({
  target: BUFF.qiImbalanceMarker,
  requiresParam: PARAM.mountainsMight,
})
