import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// "Spear Q now applies Qi Imbalance on Boss targets, increasing Qi Damage taken
// by 10% for 15 seconds" (28 May 2026 patch). Qi damage is the attribute half
// of a hit, so it lands on `attributeDamageBoost` rather than a target-wide
// vulnerability, which would lift the physical half too.
//
// Sharing `QI_IMBALANCE_STATUS`'s value is what puts the target into the low-Qi
// phase while this is up: a `Debuff` is tracked in the status ledger and never
// reaches the buff history `qiPhase` reads. The id is repeated rather than
// imported because `ids.ts` takes no imports, and the two are pinned equal by
// `tests/engine/lowQiWindow.test.ts`.
//
// Mountain's Might Tier 1 widens the trigger to any Splendor martial art. It
// changes nothing here — Qiankun's Lock already applies it, and the rotation
// opens with one.
export const qiImbalance = defineClassBuff({
  id: BUFF.qiImbalance,
  name: "Qi Imbalance",
  affectsAll: true,
  duration: 15,
  buffAppliesOnCastEnd: true,
  effects: [stat("attributeDamageBoost", 0.1)],
})
