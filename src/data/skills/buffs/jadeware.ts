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
// The window and its cooldown run off the cast alone; only the bonus asks about
// the target, so the gate sits on the effects rather than on the trigger. Every
// low-Qi source the sim models — the lead-in window, Qi Imbalance, and the
// broken bar during qi-break — reports a non-`normal` phase.
export const jadeware = defineBuff({
  id: BUFF.jadeware,
  name: "Jadeware",
  requires: { set: jadewareSet.siteKey },
  affectsAll: true,
  duration: 10,
  cooldown: 12,
  summary: "affinityDmg +10%, directAffinity +7.5% — low-Qi targets only",
  effects: (ctx) =>
    ctx.phase === "normal" ? [] : [stat("affinityDamageBoost", 0.1), stat("directAffinityRate", 0.075)],
})
