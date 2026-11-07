import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { etherwrath } from "../../sets/etherwrath"

const PENETRATION_PER_TYPE = 0.06

// "At 5 stacks of Etherwrath, grants [attribute] Penetration of all types
// when Martial Art effects deal damage." (In-game values as of 2026-10-15,
// physical penetration included.) Reach is the skills that declare this in
// their own `receives` — the falcon and the Anxi Army assist family are the
// ones a rotation actually hits; a shared bleed/DoT settlement row and the
// universal rope-dart family also carry the tag but are not mapped to a
// modelled skill on any class.
export const etherwrathPenetrationBoost = defineBuff({
  id: BUFF.etherwrathPenetrationBoost,
  name: "Etherwrath",
  requires: { set: etherwrath.siteKey },
  alwaysActive: true,
  duration: 9999,
  summary: "+6% physical and attribute penetration (all types) at 5 Etherwrath stacks",
  effects: (ctx) =>
    ctx.status.stacks(BUFF.etherwrathAttackBoost) >= 5
      ? [
          stat("phys.penetration", PENETRATION_PER_TYPE),
          stat("bellstrike.penetration", PENETRATION_PER_TYPE),
          stat("stonesplit.penetration", PENETRATION_PER_TYPE),
          stat("silkbind.penetration", PENETRATION_PER_TYPE),
          stat("bamboocut.penetration", PENETRATION_PER_TYPE),
        ]
      : [],
})
