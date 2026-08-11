import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"

// Never seeded, never alwaysActive and never triggered: this def exists for
// the catalog only. The actual +30% is a Combat Settings toggle applied
// directly in `timeline.ts`, unrelated to this `enabledParam` — no inner way
// ever maps to it, since it names a rotation/team-support toggle, not a
// build attribute (see docs/CALCULATION.md § "Mechanic coverage").
export const revelryScript = defineClassBuff({
  id: BUFF.revelryScript,
  name: "Revelry Script",
  requires: { param: PARAM.revelryScript },
  triggeredBy: [],
  duration: 9999,
  effects: [stat("allDamageBoost", 0.3)],
})
