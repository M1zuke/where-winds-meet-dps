import { defineClassBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { applyBuff, stat } from "../../engine/effects/effect"

// 1.5% direct affinity while Endless Gale is up, and 1.5% again against a boss
// (client localization, 2026-08-15). The engine simulates a boss target, so the
// two are carried as one 3% figure — the same value the reference site's own
// def and the workbook both hold.
export const mountainsMightBuff = defineClassBuff({
  id: BUFF.mountainsMight,
  name: "Mountain's Might",
  requires: { param: PARAM.mountainsMight },
  affectsAll: true,
  duration: 8,
  buffAppliesOnCastEnd: true,
  effects: [stat("directAffinityRate", 0.03)],
})

// Tier 1 is what lets a martial art other than Qiankun's Lock inflict Qi
// Imbalance, so the sword's application is routed through a def this inner way
// gates rather than declared on the skill, which carries no gate of its own.
// The spear applies it from the Nameless Spear talent and stays ungated.
// Slotting at all satisfies the rule, tier 1 being the lowest selectable.
export const mountainsMightPathQiImbalance = defineClassBuff({
  id: BUFF.mountainsMightQiImbalance,
  name: "Qi Imbalance (Splendor path)",
  requires: { param: PARAM.mountainsMight },
  duration: 15,
  buffAppliesOnCastEnd: true,
  effects: [applyBuff(BUFF.qiImbalance, 1, 15)],
})
