import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { etherwrath } from "../../sets/etherwrath"

const PENETRATION_PER_TYPE = 0.04

// "At 5 stacks of Etherwrath, grants [attribute] Penetration of all types
// when Martial Art effects deal damage." (in-game data, 2026-09-24 — the
// tooltip's own text says 6, physical included; the data gives 4, attribute
// only.) Reach is the skills that declare this in their own `receives` — the
// falcon and the Anxi Army assist family are the ones a rotation actually
// hits; a shared bleed/DoT settlement row and the universal rope-dart family
// also carry the tag but are not mapped to a modelled skill on any class.
export const etherwrathPenetrationBoost = defineBuff({
  id: BUFF.etherwrathPenetrationBoost,
  name: "Etherwrath",
  requires: { set: etherwrath.siteKey },
  alwaysActive: true,
  duration: 9999,
  summary: "+4% attribute penetration (all four types) at 5 Etherwrath stacks",
  effects: (ctx) =>
    ctx.status.stacks(BUFF.etherwrathAttackBoost) >= 5
      ? [
          stat("bellstrike.penetration", PENETRATION_PER_TYPE),
          stat("stonesplit.penetration", PENETRATION_PER_TYPE),
          stat("silkbind.penetration", PENETRATION_PER_TYPE),
          stat("bamboocut.penetration", PENETRATION_PER_TYPE),
        ]
      : [],
})
