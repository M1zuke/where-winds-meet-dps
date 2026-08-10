import { defineBuff } from "./define"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"

// Never seeded, never alwaysActive and never triggered: this def exists for
// the catalog only. The actual +30% is a Combat Settings toggle applied
// directly in `timeline.ts`, unrelated to this `enabledParam`
// (`paramMap.ts`'s `SITE_PARAM_TO_INNER_WAY` deliberately leaves it
// unmapped — see docs/CALCULATION.md § "Mechanic coverage").
export const revelryScript = defineBuff({
  id: BUFF.revelryScript,
  name: "Revelry Script",
  specs: [
    "silkbind_jade",
    "bellstrike_umbra",
    "bellstrike_splendor",
    "stonesplit_might",
    "stonesplit_strength",
    "bamboocut_dust",
  ],
  requires: { param: PARAM.revelryScript },
  triggeredBy: [],
  duration: 9999,
  effects: [stat("allDamageBoost", 0.3)],
})
