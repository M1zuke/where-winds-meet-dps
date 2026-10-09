import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// In-game talent gating as of 2026-09-24.
export const bellstrikeUmbraBleedPen = defineClassBuff({
  id: BUFF.bellstrikeUmbraBleedPen,
  name: "Bleed penetration Enhancement",
  alwaysActive: true,
  duration: 9999,
  summary: "physPen +15, bellstrikePen +15",
  effects: (ctx) =>
    ctx.self.reachesEvent
      ? [stat("phys.penetration", 0.15), stat("bellstrike.penetration", 0.15)]
      : [],
})
