import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"
import { ROLE } from "../../ids"
import { stat } from "../../../../engine/effects/effect"
import { matchesScope } from "../../../../engine/scope"

const AFFECTS = [ROLE.bleedTick, ROLE.bleedDetonation]

// `.tmp/site/deobfuscated.js`'s `Nm` mechanic (~L5544-59, read via `gr()`
// ~L21817-58) — `physPen`/`bellstrikePen: 15` is its maxPhys-anchored value
// (pen anchor 1500), which clamps to 1 only because this app's supported
// level 95 gives maxPhys ≈ 2984.
export const bellstrikeUmbraBleedPen = defineClassBuff({
  id: BUFF.bellstrikeUmbraBleedPen,
  name: "Bleed penetration Enhancement",
  requires: { param: PARAM.swordHorizon },
  affects: AFFECTS,
  triggeredBy: [],
  alwaysActive: true,
  duration: 9999,
  // The pre-conversion `BuffDef` rendered these as points (`physPen 15`), not
  // the app's internal fraction — pin the Skill Editor text to that unit.
  summary: "physPen +15, bellstrikePen +15",
  effects: (ctx) => {
    if (ctx.event.kind !== "damage" || !matchesScope(ctx.event.tags, { affects: AFFECTS }))
      return []
    return [stat("phys.penetration", 0.15), stat("bellstrike.penetration", 0.15)]
  },
})
