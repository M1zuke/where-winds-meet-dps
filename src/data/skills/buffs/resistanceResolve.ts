import { defineBuff } from "./define"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"

export const resistanceResolve = defineBuff({
  id: BUFF.resistanceResolve,
  name: "Resistance Resolve",
  requires: { param: PARAM.artOfResistance, minTier: 6 },
  triggeredBy: [],
  duration: 12,
  activeAfterBuffEnds: { buffId: BUFF.rainwhisperShield, cancelledByReapply: true },
  effects: [stat("allDamageBoost", 0.1)],
})
