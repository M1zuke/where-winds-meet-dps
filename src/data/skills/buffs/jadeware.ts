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
// In-game rule as of 2026-09-24: the direct-affinity bonus also pays out
// whenever the target's Qi percentage is below the owner's own — a training
// stake never attacks, so its Qi only ever falls, which holds for practically
// the whole fight. The sim has no continuous target-Qi tracking to gate on,
// so the direct-affinity term is unconditional here, matching that reach.
export const jadeware = defineBuff({
  id: BUFF.jadeware,
  name: "Jadeware",
  requires: { set: jadewareSet.siteKey },
  affectsAll: true,
  duration: 10,
  cooldown: 12,
  buffAppliesOnCastEnd: true,
  summary: "affinityDmg +10% for the whole window, directAffinity +7.5% for the whole window",
  effects: () => [stat("affinityDamageBoost", 0.1), stat("directAffinityRate", 0.075)],
})
