import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { jadeware as jadewareSet } from "../../sets/jadeware"

// "Casting Martial Art Skill activates Jadeware effect: Increases Affinity DMG
// by 10% and increases Direct Affinity Rate by 7.5% against targets in Qi
// Imbalance or with a Qi percentage lower than yours or below 40%. This effect
// lasts 10s and can only trigger once every 12s." (in-game set tooltip, as of
// 15 Aug 2026)
//
// The Affinity DMG half holds for the whole window. Only the Direct Affinity
// half reads the target. The player's own Qi bar is not modelled (nothing
// spends it), so it stays full and "lower than yours" reads as "the target's Qi
// is below full".
export const jadeware = defineBuff({
  id: BUFF.jadeware,
  name: "Jadeware",
  requires: { set: jadewareSet.siteKey },
  affectsAll: true,
  duration: 10,
  cooldown: 12,
  buffAppliesOnCastEnd: true,
  summary:
    "affinityDmg +10% for the whole window, directAffinity +7.5% against a target below full Qi or in Qi Imbalance",
  effects: (ctx) =>
    ctx.target.qiFraction < 1 || ctx.status.isActive(BUFF.qiImbalance)
      ? [stat("affinityDamageBoost", 0.1), stat("directAffinityRate", 0.075)]
      : [stat("affinityDamageBoost", 0.1)],
})
