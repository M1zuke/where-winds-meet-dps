import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { STATUS } from "../bamboocut-draught/ids"
import { forceOutcome } from "../../../engine/effects/effect"

// In-game values as of 2026-09-24: the talent "Increased Binge Point Gain"
// makes every hit of Dragonquench - Inebriate and Hero's Blood - Inebriate
// immune to Abrasion, but only while Binge Points is at least 200 at that hit.
export const bingePointGainNoAbrasion = defineBuff({
  id: BUFF.bingePointGainNoAbrasion,
  name: "Increased Binge Point Gain: No Abrasion",
  requires: { classId: "bamboocutDraught" },
  alwaysActive: true,
  duration: 9999,
  summary: "cannot trigger Abrasion while Binge Points is at least 200",
  effects: (ctx) =>
    ctx.self.reachesEvent && ctx.status.stacks(STATUS.bingePoints) >= 200 ? [forceOutcome("noAbrasion")] : [],
})
