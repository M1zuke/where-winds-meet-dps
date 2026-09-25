import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { requireInnerWayNodeTier } from "../../definitions/innerWays/innerWayDef"
import type { BuffModule } from "../../engine/buffs/buffModule"
import { INNER_WAY_NODE } from "./ids"
import { blossomBarrage } from "./blossomBarrage"

// blossomBarrage.ts and this module import each other — it for these
// factories' `buffDefs` entry, this module for `comboUmbLightBonusBuffDef`'s
// tier lookup — so every export below is a hoisted function, never a `const`,
// matching `wolfchasersArtBuffs.ts`'s own load-order workaround.
export function comboBuffDef(): BuffModule {
  return defineBuff({
    id: BUFF.combo,
    name: "Combo",
    requires: { param: PARAM.blossomBarrage },
    duration: 15,
    buffAppliesOnCastEnd: true,
    effects: [stat("allDamageBoost", 0.2)],
  })
}

let comboUmbLightBonusMinTier: number | undefined

// In-game values as of 2026-09-24: only the +5% branch reaches the floating
// umbrella's projectiles, and only against your Combo target's Qi break.
export function comboUmbLightBonusBuffDef(): BuffModule {
  return defineBuff({
    id: BUFF.comboUmbLightBonus,
    name: "Combo (Floating Umbrella)",
    requires: {
      param: PARAM.blossomBarrage,
      get minTier(): number {
        return (comboUmbLightBonusMinTier ??= requireInnerWayNodeTier(
          blossomBarrage,
          INNER_WAY_NODE.blossomBarrageSpringAwayBonus,
        ))
      },
    },
    requiresBuffActive: BUFF.combo,
    duration: 15,
    buffAppliesOnCastEnd: true,
    summary: "+5% damage against your Combo target while Exhausted (PvE)",
    effects: (ctx) => (ctx.phase === "exhausted" ? [stat("allDamageBoost", 0.05)] : []),
  })
}

let comboSpringAwayBonusMinTier: number | undefined

export function comboSpringAwayBonusBuffDef(): BuffModule {
  return defineBuff({
    id: BUFF.comboSpringAwayBonus,
    name: "Combo (Spring Away)",
    requires: {
      param: PARAM.blossomBarrage,
      get minTier(): number {
        return (comboSpringAwayBonusMinTier ??= requireInnerWayNodeTier(
          blossomBarrage,
          INNER_WAY_NODE.blossomBarrageSpringAwayBonus,
        ))
      },
    },
    requiresBuffActive: BUFF.combo,
    duration: 15,
    buffAppliesOnCastEnd: true,
    summary: "+10% Spring Away damage against your Combo target; +15% while Exhausted (PvE)",
    effects: (ctx) => [stat("allDamageBoost", ctx.phase === "exhausted" ? 0.15 : 0.1)],
  })
}
