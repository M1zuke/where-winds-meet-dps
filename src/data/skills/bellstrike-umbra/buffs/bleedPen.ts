import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

const PENETRATION_STEP_ATTACK = 100
const PENETRATION_CAP = 15

// In-game values as of 2026-10-15.
export const bellstrikeUmbraBleedPen = defineClassBuff({
  id: BUFF.bellstrikeUmbraBleedPen,
  name: "Bleed penetration Enhancement",
  alwaysActive: true,
  duration: 9999,
  summary: "physPen, bellstrikePen +1 per full 100 Max Physical Attack (max 15)",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent) return []
    const penetration =
      Math.min(PENETRATION_CAP, Math.floor(ctx.build.maxPhysAttack / PENETRATION_STEP_ATTACK)) / 100
    return [stat("phys.penetration", penetration), stat("bellstrike.penetration", penetration)]
  },
})
