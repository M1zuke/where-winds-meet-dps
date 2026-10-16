import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { applyBuff, damageMultiplier, stat } from "../../../../engine/effects/effect"

// In-game values as of 2026-10-15: +10% Qi damage taken for 15 s, and +10% HP
// damage and +10% Bellstrike damage taken while Exhausted ("8%" in the
// 25 June 2026 patch note is stale).
export const qiImbalance = defineClassBuff({
  id: BUFF.qiImbalance,
  name: "Qi Imbalance",
  affectsAll: true,
  duration: 15,
  summary: "+10% Qi damage taken; +10% HP damage and +10% Bellstrike damage taken while Exhausted",
  effects: (ctx) => [
    stat("target.qiDamageTaken", 0.1),
    ...(ctx.phase === "exhausted"
      ? [damageMultiplier(1.1), stat("attributeDamageBoost", 0.1)]
      : []),
  ],
})

// In-game values as of 2026-10-15: every hit of Qiankun's Lock on a boss
// applies Qi Imbalance, so a cast that lands no hit applies none.
export const qiankunsLockQiImbalance = defineClassBuff({
  id: BUFF.qiankunsLockQiImbalance,
  name: "Qi Imbalance (Qiankun's Lock)",
  duration: 15,
  stackOnDamage: true,
  stackOnDamageScoped: true,
  effects: [applyBuff(BUFF.qiImbalance, 1, 15)],
})
