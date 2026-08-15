import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { damageMultiplier, stat } from "../../../../engine/effects/effect"

// Two effects, both at the reference workbook's values.
//
// "Spear Q now applies Qi Imbalance on Boss targets, increasing Qi Damage taken
// by 10% for 15 seconds" (28 May 2026 patch) — unconditional, and Qi damage is
// the attribute half of a hit, so it lands on `attributeDamageBoost` rather
// than a target-wide vulnerability that would lift the physical half too.
//
// "now also increases all HP Damage taken by 8% & Bellstrike damage taken by 8%
// on exhausted targets" (25 June 2026 patch) — the workbook carries this at
// 10%, in a column it keeps as a separate multiplicative factor rather than
// folding into its damage-boost pool, which is why it is a `damageMultiplier`.
// The 8-vs-10 discrepancy is unresolved; the workbook postdates the note.
//
// Exhausted is the qi-break window, which is what `EffectContext.phase`
// reports, so the second effect materialises only while it is open.
//
// Sharing `QI_IMBALANCE_STATUS`'s value is what puts the target into the low-Qi
// phase while this is up: a `Debuff` is tracked in the status ledger and never
// reaches the buff history `qiPhase` reads. The id is repeated rather than
// imported because `ids.ts` takes no imports, and the two are pinned equal by
// `tests/engine/lowQiWindow.test.ts`.
//
// Mountain's Might Tier 1 widens the trigger to any Splendor martial art.
export const qiImbalance = defineClassBuff({
  id: BUFF.qiImbalance,
  name: "Qi Imbalance",
  affectsAll: true,
  duration: 15,
  buffAppliesOnCastEnd: true,
  summary: "Qi dmg +10%, and +10% damage taken while Exhausted",
  effects: (ctx) =>
    ctx.phase === "exhausted"
      ? [stat("attributeDamageBoost", 0.1), damageMultiplier(1.1)]
      : [stat("attributeDamageBoost", 0.1)],
})
