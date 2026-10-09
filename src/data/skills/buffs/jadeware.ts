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
// The player's own Qi bar is not modelled (nothing spends it), so "lower than
// yours" reads as "the target has taken any Qi damage at all" — which, since
// Qi is a function of the same HP damage, is exactly
// `remainingHealthFraction < 1`. That arm is true from the fight's first hit
// on, dominating the qiBelow/Qi-Imbalance arms in every realistic build.
export const jadeware = defineBuff({
  id: BUFF.jadeware,
  name: "Jadeware",
  requires: { set: jadewareSet.siteKey },
  affectsAll: true,
  duration: 10,
  cooldown: 12,
  buffAppliesOnCastEnd: true,
  summary: "affinityDmg +10% for the whole window, directAffinity +7.5% for the whole window",
  effects: (ctx) =>
    ctx.target.remainingHealthFraction < 1 || ctx.target.qiFraction < 0.4 || ctx.status.isActive(BUFF.qiImbalance)
      ? [stat("affinityDamageBoost", 0.1), stat("directAffinityRate", 0.075)]
      : [],
})
