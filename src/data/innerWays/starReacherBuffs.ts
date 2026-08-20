import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"

// Reference defs are unconditional per-phase multipliers
// (starReacherNormal/Below30/Exhausted.json), independently confirmed at
// 0.075/0.15 by the workbook. Not modelled: the guide's HP-above-75% branch
// and its lifesteal alternative (no HP model in the sim), and the guide's
// "targets with lingering bone" wording — the reference defs carry no such
// condition, so the two sources disagree and neither is picked.
export const starReacherBuffDef = defineBuff({
  id: BUFF.starReacher,
  name: "Star Reacher",
  requires: { param: PARAM.starReacher },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "physBoost +7.5% (normal), +15% (<30% Qi), +25% (Qi exhausted)",
  effects: (ctx) => {
    if (ctx.phase === "below30") return [stat("physBoost", 0.15)]
    if (ctx.phase === "exhausted") return [stat("physBoost", 0.25)]
    return [stat("physBoost", 0.075)]
  },
})
