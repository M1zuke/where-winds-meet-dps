import { defineClassBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"

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
