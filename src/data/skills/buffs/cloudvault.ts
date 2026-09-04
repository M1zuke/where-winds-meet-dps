import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { STATUS } from "../bamboocut-draught/ids"

// +10% against non-player units at 2 stacks (client locale text, 2026-09-04).
export const cloudvault = defineBuff({
  id: BUFF.cloudvault,
  name: "Cloudvault",
  requires: { classId: "bamboocutDraught" },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +10% on Hero's Blood - Inebriate at 2 Cloudvault stacks",
  effects: (ctx) =>
    ctx.self.reachesEvent && ctx.status.stacks(STATUS.cloudvault) >= 2 ? [stat("allDamageBoost", 0.1)] : [],
})
