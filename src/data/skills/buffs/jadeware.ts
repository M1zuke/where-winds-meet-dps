import { defineBuff } from "./define"
import { BUFF } from "./ids"
import { CAST } from "../ids"
import { stat } from "../../../engine/effects/effect"
import { jadeware as jadewareSet } from "../../sets/jadeware"

export const jadeware = defineBuff({
  id: BUFF.jadeware,
  name: "Jadeware",
  requires: { set: jadewareSet.siteKey },
  triggeredBy: [
    CAST.fanQ,
    CAST.fanQCancel,
    CAST.fanQPrepull,
    CAST.moBladeQ,
    CAST.moBladeQPrepull,
    CAST.ropeQ,
    CAST.ropeQ1Hit,
    CAST.snowpartingSpecial,
    CAST.spearQ,
    CAST.spearQ0HitCancel,
    CAST.spearQ5HitCancel,
    CAST.spearQPrepull,
    CAST.swordMartialQ,
    CAST.swordMartialQQ,
    CAST.swordMartialQQ1HitCancel,
    CAST.swordMartialQQ2HitCancel,
    CAST.swordMartialQQQ,
    CAST.swordQ,
    CAST.swordQ2nd,
    CAST.umbQ,
    CAST.umbQPrepull,
    CAST.umbrellaQ,
    CAST.umbrellaQEmpoweredPerfectCatch,
    CAST.umbrellaQPerfectCatch,
  ],
  duration: 10,
  cooldown: 12,
  // The pre-conversion `BuffDef` rendered its own key names and rounding
  // (`directAffinity 0.075` → "+8%"), not the `StatKey`-derived generic form —
  // pin the Skill Editor text to that exact string rather than letting it
  // drift with a future `StatKey` rename.
  summary: "affinityDmg +10%, directAffinity +8%",
  effects: [stat("affinityDamageBoost", 0.1), stat("directAffinityRate", 0.075)],
})
